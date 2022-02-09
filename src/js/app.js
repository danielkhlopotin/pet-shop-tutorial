App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    // Load pets.
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function() {
    // for modern dapp browsers (or more recent versions of metamask)
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.request({method: "eth_requestAccounts"});;
      } catch (error) {
        console.error("User denied account access");
      }
    // for legacy dapp browsers  
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    // go to Ganache if no injected web3 instance is detected (not suitable for production) 
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Adoption.json', function(data) {
      // get artifact (stores info such as deployed address and ABI which defines variable, functions, parameters of the contract)
      var AdoptionArtifact = data;
      // use artifact to create a contract truffle contract which helps keep contract info in sync with migrations
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
      
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets (such as if they were already adopted from a previous visit)
      return App.markAdopted();
    })

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: function() {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance; // we need to access the instance after initially retreiving it

      // use .call to read data from blockchain without sending a full transaction (don't spend either)
      return adoptionInstance.getAdopters.call(); 
    }).then(function(adopters) {
      for (i = 0; i < adopters.length; i++) {
        // check against the the default (empty) address to see if a pet has been adopted, in that case we disable the adopt button
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function(error) {
      console.log(err.message);
    })
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;

        // Execute adopt as a transaction by sending account (transactions have an associated cost)
        return adoptionInstance.adopt(petId, {from: account});
      }).then(function(result) {
        // sync the UI with our newly stored data
        return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
