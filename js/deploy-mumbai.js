let conf = {
  OpenSea: "https://testnets.opensea.io/assets/mumbai/",
  Web3Provider: "https://rpc-mumbai.maticvigil.com",
  FileJson: "FoCFactory.20220213.0.json",
};

let currentAccount = null;
let web3;
let web3M;
let abi;
let bytecode;
let svgPlain = "";
let svgSplit;
let splitSize = 16000;
let uploadTotal = 0;
let uploadCount = 0;
let contractAddress = "";

contractAddress = localStorage.getItem("contractAddress");

$.getJSON("./json/" + conf.FileJson, function (result) {
  abi = result.abi;
  bytecode = result.bytecode;
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
    }
  }
  //console.log("WalletAddress in HandleAccountChanged =" + currentAccount);
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

async function getSymbol() {
  const contract = new web3.eth.Contract(abi, contractAddress);
  contract.methods
    .symbol()
    .call()
    .then(function (result) {
      $("#tokenSymbol").val(result);
    });
}

async function getName() {
  const contract = new web3.eth.Contract(abi, contractAddress);
  contract.methods
    .name()
    .call()
    .then(function (result) {
      $("#tokenName").val(result);
      $("#collectionName").text(result);
    });
}

async function getTokenNumber() {
  let ret;
  const contract = new web3.eth.Contract(abi, contractAddress);
  await contract.methods
    .tokenNumber()
    .call()
    .then(function (result) {
      console.log("TokenNumber: " + result);
      ret = result;
    });
  return ret;
}

async function tokenURI(tokenId) {
  let ret;
  const contract = new web3.eth.Contract(abi, contractAddress);
  await contract.methods
    .tokenURI(tokenId)
    .call()
    .then(function (result) {
      ret = result;
    });
  return ret;
}

async function parseMetadata() {
  let tokenId = (await getTokenNumber()) - 1;
  let json = await tokenURI(tokenId);
  let d = json.split("base64,")[1];
  d = atob(d);
  d = JSON.parse(d);
  console.log(d);
  $("#nftName").val(d.name);
  $("#description").val(d.description);
  //  .html(d.description.replaceAll("\n", "<br/>"));
  //console.log(d.description);
  $("#nft").prop("src", d.image);
  let url = conf.OpenSea + contractAddress + "/" + tokenId;
  $("#nftA").prop("href", url);
}

async function isLocked(tokenId) {
  let ret;
  const contract = new web3.eth.Contract(abi, contractAddress);
  await contract.methods
    .isLocked(tokenId)
    .call()
    .then(function (result) {
      ret = result;
    });
  return ret;
}

async function mint() {
  let nftName = $("#nftName").val();
  let description = $("#description").val();
  description = description.replaceAll("\n", "\\n");
  $("#mint").prop("disabled", true);
  const contract = new web3M.eth.Contract(abi, contractAddress);
  await contract.methods
    .mint(currentAccount, nftName, description)
    .send(
      {
        from: currentAccount,
      },
      function (error, transactionHash) {
        console.log(error);
        $("#mint").prop("disabled", false);
      }
    )
    .on("transactionHash", (hash) => {
      console.log(hash);
    })
    .on("receipt", function (receipt) {
      console.log("minted");
      update();
      setTimeout(async () => {
        update();
      }, 2000);
    })
    .on("confirmation", () => {
      console.log("confirmed");
      update();
    })
    .on("error", function (error, receipt) {
      console.log(error);
    });
  await update();
}

async function freeze() {
  $("#freeze").prop("disabled", true);
  let tokenId = (await getTokenNumber()) - 1;
  const contract = new web3M.eth.Contract(abi, contractAddress);
  await contract.methods
    .lock(tokenId)
    .send(
      {
        from: currentAccount,
      },
      function (error, transactionHash) {
        $("#freeze").prop("disabled", false);
      }
    )
    .on("transactionHash", (hash) => {
      console.log(hash);
    })
    .on("receipt", function (receipt) {
      console.log("freezed");
      let url = conf.OpenSea + contractAddress + "/" + tokenId;
      $("#message").html(
        'Done! Check <a href="' + url + '" target=_blank>' + url + "</a>"
      );
    })
    .on("error", function (error, receipt) {
      console.log(error);
    });
  await update();
}

async function updateNameDescription() {
  let nftName = $("#nftName").val();
  let description = $("#description").val();
  description = description.replaceAll("\n", "\\n");
  $("#updateNameDescription").prop("disabled", true);
  const contract = new web3M.eth.Contract(abi, contractAddress);
  await contract.methods
    .setNameDescription((await getTokenNumber()) - 1, nftName, description)
    .send(
      {
        from: currentAccount,
      },
      function (error, transactionHash) {
        console.log(error);
        $("#updateNameDescription").prop("disabled", false);
      }
    )
    .on("transactionHash", (hash) => {
      console.log(hash);
    })
    .on("receipt", function (receipt) {
      //      console.log("updated");
      $("#updateNameDescription").prop("disabled", false);
      update();
    })
    .on("error", function (error, receipt) {
      console.log(error);
    });
  await update();
}

async function getValue() {
  console.log("GetValue");
  input_value = $("#value").val();
  const contractFirst = new web3.eth.Contract(abi, contractAddress);
  console.log("getValue" + currentAccount);
  contractFirst.methods
    .tokenURI(parseInt(input_value))
    .call()
    .then(function (result) {
      let d = result.split("base64,")[1];
      d = atob(d);
      console.log(d);
      d = JSON.parse(d);
      console.log(d);
      $("#name").text(d.name);
      $("#description").html(d.description.replaceAll("\n", "<br/>"));
      console.log(d.description);
      $("#nft").prop("src", d.image);
    });
}

const getDeployContract = () => {
  let tokenName = $("#tokenName").val();
  let tokenSymbol = $("#tokenSymbol").val();
  const contract = new web3M.eth.Contract(abi);
  return contract.deploy({
    data: bytecode,
    arguments: [tokenName, tokenSymbol],
  });
};

const estimateDeploy = async () => {
  getDeployContract().estimateGas(function (err, gas) {
    $("#gasDeploy").text(
      "Estimate: " + ((gas * 30) / 10 ** 9).toFixed(4) + " MATIC to Deploy"
    );
  });
};

const deploy = async () => {
  await getDeployContract()
    .send(
      {
        from: currentAccount,
      },
      function (error, transactionHash) {}
    )
    .on("error", function (error) {})
    .on("transactionHash", function (transactionHash) {
      $("#deploy").prop("disabled", true);
      $("#deploy").text("Deploying...");
    })
    .on("receipt", function (receipt) {
      console.log(receipt.contractAddress); // contains the new contract address
      contractAddress = receipt.contractAddress;
      localStorage.setItem("contractAddress", contractAddress);
      $("#deploy").text("Deployed");
      update();
    });
  await update();
};

const loadImage = async () => {
  const showOpenFileDialog = () => {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".svg, image/svg+xml";
      input.onchange = (event) => {
        resolve(event.target.files[0]);
      };
      input.click();
    });
  };
  const readAsText = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        resolve(reader.result);
      };
    });
  };
  const file = await showOpenFileDialog();
  const content = await readAsText(file);

  const loadSplitSvg = (content, len) => {
    let data = [];
    let text = content;
    let length = text.length;

    while (length > 0) {
      data.push(text.slice(0, len));
      text = text.slice(len);
      length = text.length;
    }
    return data;
  };

  svgPlain = content;
  svgSplit = loadSplitSvg(content, splitSize);
  uploadCount = 0;
  update();
};

async function uploadImage() {
  let sendbytes = web3.utils.utf8ToHex(svgSplit[uploadCount]);
  $("#uploadImage").prop("disable", true);
  let tokenId = (await getTokenNumber()) - 1;
  const contract = new web3M.eth.Contract(abi, contractAddress);
  await contract.methods
    .setData(tokenId, uploadCount, sendbytes)
    .send(
      {
        from: currentAccount,
      },
      function (error, transactionHash) {}
    )
    .on("transactionHash", (hash) => {
      console.log(hash);
    })
    .on("receipt", function (receipt) {
      console.log("uploaded #" + (uploadCount + 1));
      uploadCount = uploadCount + 1;
      if (uploadCount != uploadTotal) {
        $("#uploadImage").prop("disable", false);
      } else {
        let url = conf.OpenSea + contractAddress + "/" + tokenId;
        $("#message").html(
          'Upload! Check <a href="' +
            url +
            '" target=_blank>' +
            url +
            "</a> before Freeze"
        );
        parseMetadata();
      }
      update();
    })
    .on("error", function (error, receipt) {
      console.log(error);
    });

  await update();
}

async function getTokenName(tokenId) {
  let ret;
  const contract = new web3.eth.Contract(abi, contractAddress);
  await contract.methods
    .getName(tokenId)
    .call()
    .then(function (result) {
      ret = result;
    });
  return ret;
}

async function getDescription(tokenId) {
  let ret;
  const contract = new web3.eth.Contract(abi, contractAddress);
  await contract.methods
    .getDescription(tokenId)
    .call()
    .then(function (result) {
      ret = result;
    });
  return ret;
}

const updateND = async () => {
  let tokenId = (await getTokenNumber()) - 1;
  $("#nftName").val(await getTokenName(tokenId));
  $("#description").val(await getDescription(tokenId));
};

const update = async () => {
  if ($("#isMember").prop("checked") === false) {
    $("#deploy").prop("disabled", true);
  } else {
    $("#deploy").prop("disabled", false);
  }
  if (contractAddress !== "") {
    $("#addressContract").text(contractAddress);
    await getName();
    await getSymbol();
    let num = await getTokenNumber();
    if (num > 0) {
      if ((await isLocked(num - 1)) === false) {
        $("#mint").prop("disabled", true);
        $("#freeze").prop("disabled", false);
        $("#uploadImage").prop("disabled", true);
        //parseMetadata(num - 1);

        if (svgPlain.length > 0) {
          $("#loadImage").prop("disabled", true);
          let message = (svgPlain.length / 1024).toFixed(2) + "KB";
          if (svgPlain.length / 1024 < 83.0) {
            message = message + " => OK";
            uploadTotal = Math.ceil(svgPlain.length / splitSize);
            if (uploadCount != uploadTotal) {
              $("#uploadImage").prop("disabled", false);
              $("#uploadImage").text(
                "③-3. Upload #" + (uploadCount + 1) + " of " + uploadTotal
              );
            } else {
              $("#uploadImage").text("③-3. Uploaded");
            }
          }

          $("#fileSize").text(message);
        } else {
          $("#loadImage").prop("disabled", false);
        }
      } else {
        $("#freeze").prop("disabled", true);
        $("#updateNameDescription").prop("disabled", true);
        $("#loadImage").prop("disabled", true);
        $("#uploadImage").prop("disabled", true);
      }
    } else {
      $("#freeze").prop("disabled", true);
      $("#updateNameDescription").prop("disabled", true);
      $("#loadImage").prop("disabled", true);
      $("#uploadImage").prop("disabled", true);
    }
  }
  await estimateDeploy();
};

$(document).ready(async () => {
  m = detectMetaMask();
  if (m) {
    $("#metaicon").removeClass("meta-gray");
    $("#metaicon").addClass("meta-normal");
    $("#enableMetamask").attr("disabled", false);
    connect(); // Make sure the connected wallet is being returned
  } else {
    $("#enableMetamask").attr("disabled", true);
    $("#metaicon").removeClass("meta-normal");
    $("#metaicon").addClass("meta-gray");
  }

  $("#enableMetamask").click(() => {
    connect();
  });

  $("#setValue").click(() => {
    getValue();
    getSymbol();
    getName();
  });

  $("#deploy").click(() => {
    deploy();
  });

  $("#mint").click(() => {
    mint();
  });
  $("#freeze").click(() => {
    freeze();
  });
  $("#updateNameDescription").click(() => {
    updateNameDescription();
  });

  $("#loadImage").click(() => {
    loadImage();
  });

  $("#uploadImage").click(() => {
    uploadImage();
  });

  $("#isMember").click(() => {
    update();
  });

  try {
    web3 = new Web3(new Web3.providers.HttpProvider(conf.Web3Provider));
  } catch (error) {
    alert(error);
  }
  try {
    web3M = new Web3(ethereum);
  } catch (error) {
    alert(error);
  }

  setTimeout(async () => {
    await update();
  }, 1000);
  setInterval(async () => {
    await update();
  }, 60000);

  setTimeout(async () => {
    let tokenId = (await getTokenNumber()) - 1;
    if (tokenId >= 0) {
      if ((await isLocked(tokenId)) === false) {
        await parseMetadata();
      } else {
        //updateND();
      }
    }
  }, 2000);
});
