let currentAccount = null;
let web3;
let abi;
let contractAddress;

const NODE_URL = ["https://polygon-rpc.com"];

const web3p = new Web3(NODE_URL[0]);

$.getJSON("contract.json", function (result) {
  contractAddress = result.JPYCFaucet;
  abi = result.abiFaucet;
});

function handleAccountsChanged(accounts) {
  console.log("Calling HandleChanged");

  if (accounts.length === 0) {
    console.log("Please connect to MetaMask.");
    $("#enableMetamask").html("Connect with Metamask");
  } else if (accounts[0] !== currentAccount) {
    currentAccount = accounts[0];
    $("#enableMetamask").html(currentAccount);
    $("#status").html("");

    if (currentAccount != null) {
      // Set the button label
      $("#enableMetamask").html(currentAccount);
      try {
        web3 = new Web3(ethereum);
      } catch (error) {
        alert(error);
      }
    }
  }
  console.log("WalletAddress in HandleAccountChanged =" + currentAccount);
}

function connect() {
  console.log("Calling connect()");
  ethereum
    .request({ method: "eth_requestAccounts" })
    .then(handleAccountsChanged)
    .catch((err) => {
      if (err.code === 4001) {
        console.log("Please connect to MetaMask.");
        $("#status").html("You refused to connect Metamask");
      } else {
        console.error(err);
      }
    });
}

function detectMetaMask() {
  if (typeof window.ethereum !== "undefined") {
    return true;
  } else {
    return false;
  }
}

function getStock() {
  const contract = new web3p.eth.Contract(abi, contractAddress);
  contract.methods
    .getStock()
    .call()
    .then((values) => {
      if (values == 0) $("#claim").prop("disabled", true);
      console.log("stock: ", values);
      $("#stock").text("Stock available: " + values.toString());
    });
}

async function claim() {
  $("#claim").prop("disabled", true);

  try {
    web3 = new Web3(ethereum);
  } catch (error) {
    alert(error);
  }
  const contract = new web3.eth.Contract(abi, contractAddress);
  contract.methods
    .claim()
    .send({ from: currentAccount })
    .on("transactionHash", (hash) => {
      console.log(hash);
      $("#hash").append(
        "<a href='https://polygonscan.com/tx/" +
          hash +
          "' target=_blank>" +
          hash +
          "</a><br/><br/>"
      );
      $("#claim").text("claiming... wait for a while");
    })
    .on("receipt", function (receipt) {
      $("#claim").text("Claimed!");
    })
    .on("error", function (error, receipt) {
      // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
      console.log(error);
    });
}

function detectMetaMask() {
  if (typeof window.ethereum !== "undefined") {
    return true;
  } else {
    return false;
  }
}

$(document).ready(function () {
  m = detectMetaMask();
  if (m) {
    $("#enableMetamask").attr("disabled", false);
    connect();
  } else {
    $("#metaicon").addClass("meta-gray");
  }

  $("#enableMetamask").click(function () {
    connect();
  });

  $("#claim").click(function () {
    claim();
  });

  setTimeout(getStock, 1000);
  setInterval(getStock, 10000);
});
