const bcrypt = require("bcrypt");

async function test() {
  const password = "12345";

  const hashedPassword = await bcrypt.hash(password, 10);

  console.log("Original password:", password);
  console.log("Hashed password:", hashedPassword);

  const match = await bcrypt.compare(password, hashedPassword);

  console.log("Password match:", match);
}

test();