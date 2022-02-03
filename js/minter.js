let currentAccount = null;
let web3;
let abi;
let contractAddress;

$.getJSON("contract.json", function (result) {
  contractAddress = result.FoCNFTCert;
  abi = result.abi;
  console.log(contractAddress);
  $("#contractAddress").text(contractAddress);
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
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
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

async function mint() {
  $("#mint").prop("disabled", true);
  let templateNo = parseInt($("#templateNo").val());
  console.log("mint", templateNo);
  try {
    web3 = new Web3(ethereum);
  } catch (error) {
    alert(error);
  }
  const contract = new web3.eth.Contract(abi, contractAddress);
  contract.methods
    .mint(templateNo)
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
      $("#mint").text("minting... wait for a while");
    })
    .on("receipt", function (receipt) {
      $("#mint").text("minted!");
      $("#hash").append(
        "<a href='https://openSea.io/" +
          currentAccount +
          "' target=_blank>Check on Opensea. https://opensea.io/" +
          currentAccount +
          "</a>"
      );
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

async function change() {
  $("#changeTemplate").prop("disabled", true);
  let tokenId = parseInt($("#tokenId").val());
  console.log(tokenId);
  let templateNo = parseInt($("#templateNoChange").val());
  console.log("change", tokenId, "template#", templateNo);
  try {
    web3 = new Web3(ethereum);
  } catch (error) {
    alert(error);
  }
  const contract = new web3.eth.Contract(abi, contractAddress);
  contract.methods
    .changeTemplateOfToken(tokenId, templateNo)
    .send({ from: currentAccount })
    .on("transactionHash", (hash) => {
      console.log(hash);
      $("#hashChange").append(
        "<a href='https://polygonscan.com/tx/" +
          hash +
          "' target=_blank>" +
          hash +
          "</a><br/><br/>"
      );
      $("#changeTemplate").text("Changing template... wait for a while");
    })
    .on("receipt", function (receipt) {
      $("#changeTemplate").text("Template changed!");
      $("#hashChange").append(
        "<a href='https://openSea.io/" +
          currentAccount +
          "' target=_blank>Check on Opensea. https://opensea.io/" +
          currentAccount +
          "</a><br/><br/><font color=red>OpenSeaで変更を確認するためにはRefresh Metadataボタンを押してください（キャッシュの更新）</font>"
      );
    })
    .on("error", function (error, receipt) {
      // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
      console.log(error);
    });
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

  $("#mint").click(function () {
    mint();
  });

  $("#changeTemplate").click(function () {
    change();
  });
});
