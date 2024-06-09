const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const {utf8ToBytes} = require("ethereum-cryptography/utils");
const {keccak256} = require("ethereum-cryptography/keccak");
const secp = require('ethereum-cryptography/secp256k1');

app.use(cors());
app.use(express.json());

function hashMessage(message) {
  return keccak256(utf8ToBytes(message));
}

const balances = {
  "024a05c3d306cce536b1f929231e6c309c84b5082abcc3ec450379bba165684e5d": 100,
  "022673fde757a4229de8c45930c4b6c3f4b675a3c24152bacdd4f8c8b5b3cdae57": 50,
  "03e3169f3c999aaddd0ee8b149dc01a674425fc38bf56107dfbaeeb8e8d3e2a04f": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { signature, recipient, amount } = req.body;
  const { r, s, recovery } = signature;
  const message = `eth_transfer_${amount}_${recipient}`;
  const sig = new secp.secp256k1.Signature(BigInt(r), BigInt(s), recovery);
  const sender = sig.recoverPublicKey(hashMessage(message)).toHex();

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
