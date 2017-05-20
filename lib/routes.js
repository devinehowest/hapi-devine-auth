const validateAuthModel = require(`./validateAuthModel`);

module.exports = authModel => {

  const {[authModel]: Model} = require(`mongoose`).models;

  if (!Model) throw new Error(
    `${authModel} does not exist`
  );

  if (!validateAuthModel(Model.schema.obj)) {
    throw new Error(`[${modelName}] please provide scope / password / login fields`);
  }

  const {
    fields,
    projection,
    modelName,
    route,
    validation
  } = require(`hapi-devine-api-config`)(Model, {auth: true});

  const Boom = require(`boom`);
  const {pick, omit} = require(`lodash`);

  const {API_BASE = `/api`} = process.env;

  const getFullUrl = suffix => {
    const {URL = `http://localhost`, PORT} = process.env;
    const isDevelopment = (URL === `http://localhost`);
    return `${URL}${isDevelopment ? `:${PORT}` : ``}${suffix}`;
  };

  const methods = {

    me: (req, res) => {

      const {sub: _id} = req.token;

      const filter = {_id}; // select by _id

      Model.findOne(
      filter,
      projection.join(` `) // projection
    )
    .then(d => {

      // no data -> CODE: 404 => NOT FOUND
      if (!d) return res(
        Boom.notFound(`${modelName} with _id ${_id} does not exist`)
      );

      return res(
        d // data
      ); // CODE: 200 =>  OK

    })
    .catch(err => res(
      Boom.badRequest(err.message)) // mongoose, mongodb errors (400)
    );


    },

    auth: (req, res) => {

      const {
      [fields.password]: password,
      audience,
      login,
      expiresIn,
      notBefore
    } = req.payload;

      const $or = fields.login.map(f => {
        return {[f]: login};
      });

      Model.findOne({
        $and: [{$or, isActive: true}]
      }).then(user => {

        if (!user) return res(
        Boom.badRequest(`login / password combination incorrect`)
      );

        user.verifyPassword(password, (err, isValid) => {

          if (err || !isValid) return res(
          Boom.badRequest(`login / password combination incorrect`)
        );

          const {_id: subject} = user;

          user = pick(
          user.toJSON(),
          fields.token
        );

          return res.token(user, {subject, audience, expiresIn, notBefore});

        });

      }).catch(err => res(
      Boom.badRequest(err.message)
    ));

    },

    create: (req, res) => {

      const payload = pick(req.payload, fields.input);

    // create new instance of model (with payload as data)
      const model = new Model(payload);

    // insert model
      model.save()
      .then(d => {

        if (!d) return res( // insert failed
          Boom.badRequest(`cannot save ${modelName}`)
        );

        // no projection on save, manual via omit
        d = omit(
          d.toJSON(),
          projection.map(p => p.startsWith(`-`) ? p.slice(1) : p) // projection without ('-')
        );

        return (
          res(d) // result
            .header(`Location`, getFullUrl(`${route}/${d._id}`)) // LOCATION HEADER
            .code(201) // code: 201 => CREATED
        );

      })
      .catch(err => res(
        Boom.badRequest(err.message) // mongoose, mongodb errors
      ));

    }


  };

//******************************************************************//

  return [

    {

      method: `POST`,
      path: `${API_BASE}/auth`,

      handler: methods.auth,

      config: {

        auth: {
          strategy: `token`,
          mode: `try` /* mode: optional, same as try, but fails on invalid token */
        },

        validate: {

          options: {
            abortEarly: false
          },

          payload: validation.AUTH

        },
      }

    },

    {

      method: `POST`,
      path: route,

      handler: methods.create,

      config: {

        auth: {
          strategy: `token`,
          mode: `try` /* mode: optional, same as try, but fails on invalid token */
        },

        validate: validation.POST

      }

    },

    {

      config: {

        auth: {
          strategy: `token`,
          mode: `required`
        },

      },

      method: `GET`,
      path: `${API_BASE}/me`,
      handler: methods.me

    }

  ];

};
