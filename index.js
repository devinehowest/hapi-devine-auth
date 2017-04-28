const jwt = require(`jsonwebtoken`);

module.exports.register = (server, options, next) => {

  const {issuer, secret} = options;

  if (!issuer || !secret) throw new Error(
    `'issuer' and 'secret' are required`
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

    server.decorate(`reply`, `token`, function(user, {subject, audience, expiresIn = `7d`} = {}) {

      const reply = this;

      subject = `${subject}`;

      const token = jwt.sign(
        user,
        secret,
        {
          expiresIn,
          issuer,
          audience,
          subject
        }
      );

      return reply({token});

    });

    server.auth.strategy(`token`, `jwt`, {key: secret, verifyOptions: {
      issuer
    }});

  });

  next();

};

module.exports.register.attributes = {
  pkg: require(`./package.json`)
};
