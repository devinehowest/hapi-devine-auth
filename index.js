const jwt = require(`jsonwebtoken`);
const uuid = require(`uuid`);

const routes = require(`./lib/routes`);

const chalk = require(`chalk`);
const logRoute = require(`./lib/logRoute`);

module.exports.register = (server, options, next) => {

  const {issuer, secret, authModel, log = true} = options;

  if (!issuer || !secret || !authModel) throw new Error(
    `'issuer', 'secret' and 'authModel' are required`
  );

  server.register(require(`hapi-auth-jwt`), err => {

    if (err) return console.error(err);

    server.decorate(`request`, `hasScope`, function(scope) {

      const req = this;

      const {auth} = req;

      if (auth.isAuthenticated) {

        const {credentials} = auth;

        if (Array.isArray(scope)) return scope.find(s => s === credentials.scope);
        else return scope === credentials.scope;

      }

      return false;

    });

    server.decorate(`request`, `token`, function() {
      return this.auth.credentials;
    });

    server.decorate(`reply`, `token`, function(user, {subject, audience, expiresIn = `7d`, notBefore} = {}) {

      const reply = this;

      subject = `${subject}`;

      const jwtid = uuid.v4();

      const token = jwt.sign(
        user,
        secret,
        {
          expiresIn,
          issuer,
          notBefore,
          audience,
          subject,
          jwtid
        }
      );

      return reply({token});

    });

    server.auth.strategy(`token`, `jwt`, {key: secret, verifyOptions: {
      issuer
    }});

    const r = routes(authModel);
    server.route(r);

    if (log) console.log(``);
    console.log(`${chalk.yellow(`hapi-devine-auth`)}: registered routes:`);
    if (log) console.log(``);
    r.forEach(rr => logRoute(rr));
    if (log) console.log(``);

    next();

  });

};

module.exports.register.attributes = {
  pkg: require(`./package.json`)
};
