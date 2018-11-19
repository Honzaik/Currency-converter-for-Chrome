currencyArray = [];
currencyNamesArray = [];
currencyRates = [];
lastInput = null;
infoShown = false;
browserObject = null;

$(document).ready(function() {
    if(typeof chrome !== 'undefined'){
      browserObject = chrome;
    }else{
      browserObject = browser;
    }
    console.log(browserObject);
    fetchCurrencies();
});


function readSettings(){
	savedCurrencies = browserObject.storage.local.get("currencies", function(result){
    	if(result["currencies"] == "" || result["currencies"] == null){
	    	setCurrencies(["usd", "eur"]);
	    }else{
	    	setCurrencies(result["currencies"]);
	    }
    });
    $(".loading").slideUp(500);
}

function parseCurrencyName(name){
  console.log("parsing " + name);
  var parts = name.split("-");
  console.log(parts);
  var parsedName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
  if(parts.length > 2){
    parsedName += " " + parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
  }
  return parsedName;
}

function parseCurrencyJSON(currencies){
  Object.keys(currencies).sort().forEach(function(key) {
    var value = currencies[key];
    delete currencies[key];
    currencies[key] = value;
  });
  Object.keys(currencies).forEach(function(short){
    currencyArray.push(short);
    currencyNamesArray.push(currencies[short].code + " - " + currencies[short].name);
    var rates = {
      rate: parseFloat(currencies[short].rate),
      inverseRate: parseFloat(currencies[short].inverseRate)
    };
    currencyRates[short] = rates;
  })
}

function cacheJSON(json){
  browserObject.storage.local.set({currencyJSON : {
    ts: Date.now(),
    currencyJSON: json
  }});
}

function fetchCurrencies(){
	currencyArray = [];
	currencyNamesArray = [];
  currencyJSON = null;
  browserObject.storage.local.get("currencyJSON", function(result){
    resultJSON = result["currencyJSON"];
    if(resultJSON == "" || resultJSON == null || resultJSON.ts < (Date.now()-12*60*60)){
      $.ajax({
        url: "https://floatrates.com/daily/usd.json",
        dataType: "json",
        success: function(responseJSON){
          responseJSON.usd = {
            code: "USD",
            rate: 1,
            inverseRate: 1,
            name: "United States Dollar",
          };
          parseCurrencyJSON(responseJSON);
          cacheJSON(responseJSON);
          readSettings();
        },
      });
    }else{
      console.log("cached");
      parseCurrencyJSON(resultJSON.currencyJSON);
      readSettings();
    }
  });
}

function populateOptions(symbolArray, nameArray){
	currencySelect = $("select.currency-select");
	$(currencySelect).each(function(){
		console.log($(this).children().length);
		if($(this).children().length == 1){
			for(i = 0; i < symbolArray.length; i++){
				$(this).append("<option value='" + symbolArray[i] + "'>" + nameArray[i] + "</option>");
			}
		}
	});
	$("select").formSelect();
}

$("#currencies").on("change", "select.currency-select", function(){
	currencySymbol = $(this).val();
	input = $(this).parent().parent().prev().children("input.amount");
	$(input).attr("id", currencySymbol);
	recalculate(lastInput);
});

$("#button-add").click(function(){
	currencyRow = `
	<div class="row currency-row">
		<div class="col s5">
			<input placeholder="Amount" id="" type="number" class="amount">
		</div>
		<div class="col s7 currency-cont">
			<select class="currency-select">
				<option value="none" disabled selected>Choose currency</option>
			</select>
		</div>
	</div>`;
	$("#currencies").append(currencyRow);
	populateOptions(currencyArray, currencyNamesArray);
	saveSettings();
});

$("#button-remove").click(function(){
	if($("#currencies .currency-row").length > 2){
		$(".currency-row").last().remove();
		saveSettings();
		$("select").formSelect();
	}
});

$("#currencies").on("keyup", "input.amount", function(){
	recalculate(this);
});

function recalculate(input){
	amount = $(input).val();
	currency = $(input).attr("id");
	amountInputs = $("input.amount");
	currenciesToConvert = [];
	$(amountInputs).each(function(){
		if ($(this).attr("id") != currency && $(this).attr("id") != ''){
			currenciesToConvert.push($(this).attr("id"));
		}
	});

  console.log(currenciesToConvert);

	if(!isNaN(amount) && currency != '' && amountInputs.length > 1){ // input is a number
		convertedAmounts = [];
		currenciesToConvert.forEach(function(symbol){
			convertCurrency(currency, symbol, amount);
		});
	}
	lastInput = input;
	saveSettings();
}

function convertCurrency(from, to, amount){
  var fromInUSD = amount*currencyRates[from].inverseRate;
  $("input#" + to).val(fromInUSD*currencyRates[to].rate);
}

function setCurrencies(array){
	amountInputs = $("input.amount");
	if(amountInputs.length < array.length){
		for(i = 0; i < (array.length + i - amountInputs.length); i++){
			$("#button-add").trigger("click");
		}
	}else{
		populateOptions(currencyArray, currencyNamesArray);
	}
	amountInputs = $("input.amount");
	selects = $("select.currency-select");
	for(i = 0; i < array.length; i++){
		$(amountInputs[i]).attr("id", array[i]);
		$(selects[i]).find("option[value='" + array[i] + "']").prop('selected', true);
		console.log($(selects[i]).find("option[value='" + array[i] + "']").html());
	}
	$("select").formSelect();
}

function saveSettings(){
	currencies = [];
	amountInputs = $("input.amount");
	$(amountInputs).each(function(){
		if ($(this).attr("id") != ''){
			currencies.push($(this).attr("id"));
		}
	});
	if(currencies != null && currencies != ''){
		browserObject.storage.local.set({"currencies" : currencies});
	}
	
}

$(".heading").click(function(){
	if(!infoShown){
		$(".info").slideDown(500);
		infoShown = true;
	}else{
		$(".info").slideUp(500);
		infoShown = false;
	}
});