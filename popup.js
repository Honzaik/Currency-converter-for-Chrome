currencyArray = [];
currencyNamesArray = [];
lastInput = null;
infoShown = false;

$(document).ready(function() {
    fetchCurrencies();
    
});


function readSettings(){
	savedCurrencies = chrome.storage.local.get("currencies", function(result){
    	if(result["currencies"] == "" || result["currencies"] == null){
	    	setCurrencies(["USD", "EUR"]);
	    }else{
	    	console.log(result["currencies"]);
	    	setCurrencies(result["currencies"]);
	    }
    });
    $(".loading").slideUp(500);
}

function fetchCurrencies(){
	currencyArray = [];
	currencyNamesArray = [];
	$.get("https://www.google.com/finance/converter", function(response){
		currency_options = $(response).find("select").first().children();
		$(currency_options).each(function(){
			currencyArray.push(this.value);
			currencyNamesArray.push($(this).text());
		});
		readSettings();
	});
}

function populateOptions(symbolArray, nameArray){
	currencySelect = $("select.currency-select");
	for(i = 0; i < symbolArray.length; i++){
		$(currencySelect).append("<option value='" + symbolArray[i] + "'>" + nameArray[i] + "</option>");
	}
	$("select").material_select();

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
		$("select").material_select();
	}
});

$("#currencies").on("keyup", "input.amount", function(){
	recalculate(this);
});

function recalculate(input){
	amount = $(input).val();
	currency = $(input).attr("id");
	amountInputs = $("input.amount");
	allCurrenciesSet = true;
	currenciesToConvert = [];
	$(amountInputs).each(function(){
		if ($(this).attr("id") != currency && $(this).attr("id") != ''){
			currenciesToConvert.push($(this).attr("id"));
		}
	});

	if(!isNaN(amount) && allCurrenciesSet && amountInputs.length > 1){ // input is a number
		convertedAmounts = [];
		currenciesToConvert.forEach(function(symbol){
			convertCurrency(currency, symbol, amount);
		});
	}
	lastInput = input;
	saveSettings();
}

function convertCurrency(from, to, amount){
	url = "https://www.google.com/finance/converter?a=" + amount + "&from=" + from + "&to=" + to;
	$.get(url, function(response){
		string = $(response).find(".bld").text();
		convertedAmount = parseFloat(string.substring(0, string.length - 4));
		$("input#" + to).val(convertedAmount);
	});
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
	$("select").material_select();
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
		chrome.storage.local.set({"currencies" : currencies});
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