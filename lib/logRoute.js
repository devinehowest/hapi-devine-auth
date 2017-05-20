const chalk = require(`chalk`);

module.exports = ({path, method}) => {
  console.log(
    `  ${chalk.yellow(`${method}`)} -> ${chalk.cyan(`${path}`)}`
  );
};
