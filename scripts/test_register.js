const http = require("http");

function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const json = JSON.stringify(data);
    const options = {
      hostname: "localhost",
      port: 3000,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(json),
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on("error", reject);
    req.write(json);
    req.end();
  });
}

async function run() {
  console.log("Teste: criar usuário (esperado 201)");
  const user = {
    username: "teste_user",
    email: "teste@example.com",
    password: "Senha123!",
  };
  const res1 = await postJson("/register", user);
  console.log("Status:", res1.status);
  console.log("Body:", res1.body);

  console.log("\nTeste: criar mesmo usuário novamente (esperado 400)");
  const res2 = await postJson("/register", user);
  console.log("Status:", res2.status);
  console.log("Body:", res2.body);
}

run().catch((err) => {
  console.error("Erro ao rodar testes:", (err && err.message) || err);
  process.exit(1);
});
