const generateEventCode = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let code = "";

  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }

  for (let i = 0; i < 4; i++) {
    code += numbers[Math.floor(Math.random() * numbers.length)];
  }

  return code;
};

module.exports = generateEventCode;
