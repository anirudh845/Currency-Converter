// FreeCurrencyAPI configuration
const API_KEY = "fca_live_Qo9VKt6Gragnkx29LROqKugWKimhNBvqyK0RSlCL";
const BASE_URL = "https://api.freecurrencyapi.com/v1/latest";

// DOM Elements
const fromCurr = document.querySelector("#from-select");
const toCurr = document.querySelector("#to-select");
const msgBox = document.querySelector(".message-box");
const amountInput = document.querySelector("#amount");
const btn = document.querySelector(".convert");
const fromFlag = document.querySelector("#from-flag");
const toFlag = document.querySelector("#to-flag");
const fromCountryName = document.querySelector("#from-country-name");
const toCountryName = document.querySelector("#to-country-name");
const errorMessage = document.querySelector(".enter-amount .error-message");

// Default currencies
const DEFAULT_FROM = "USD";
const DEFAULT_TO = "INR";

// Function to update flag and country name
const updateFlagAndName = (selectElement) => {
    if (!selectElement || !selectElement.value) return;
    
    let selectedCode = selectElement.value;
    const selectedCountry = countryData.countries.country.find(
        country => country.currencyCode === selectedCode
    );

    if (selectedCountry) {
        let newSrc = `https://flagcdn.com/64x48/${selectedCountry.countryCode}.png`;
        let countryName = selectedCountry.countryName;
        
        if (selectElement.id === 'from-select') {
            fromFlag.src = newSrc;
            fromCountryName.textContent = countryName;
        } else if (selectElement.id === 'to-select') {
            toFlag.src = newSrc;
            toCountryName.textContent = countryName;
        }
    }
}

// Function to populate dropdowns
function initializeDropdowns() {
    const dropdowns = [fromCurr, toCurr];
    
    dropdowns.forEach((select) => {
        if (typeof countryData !== 'undefined') {
            select.innerHTML = '';
            
            // Filter currencies to only include those supported by FreeCurrencyAPI
            const supportedCurrencies = [
                "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "CNY", "HKD",
                "SGD", "INR", "MXN", "PHP", "IDR", "THB", "MYR", "ZAR", "RUB", "TRY",
                "BRL", "KRW", "SEK", "NOK", "DKK", "PLN", "HUF", "CZK", "ILS", "CLP",
                "PKR", "BDT", "EGP", "AED", "SAR", "QAR", "KWD", "OMR", "BHD", "VND",
                "ARS", "COP", "PEN", "UYU", "BOB", "PYG"
            ];
            
            // Only add currencies that exist in both countryData and supported list
            countryData.countries.country.forEach(country => {
                if (supportedCurrencies.includes(country.currencyCode)) {
                    let newOption = document.createElement("option");
                    newOption.textContent = country.currencyCode;
                    newOption.value = country.currencyCode;
                    
                    if ((select === fromCurr && country.currencyCode === DEFAULT_FROM) ||
                        (select === toCurr && country.currencyCode === DEFAULT_TO)) {
                        newOption.selected = true;
                    }
                    
                    select.appendChild(newOption);
                }
            });
            
            updateFlagAndName(select);
        }

        select.addEventListener('change', (evt) => {
            updateFlagAndName(evt.target);
        });
    });
}

// Initialize dropdowns when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof countryData !== 'undefined') {
        initializeDropdowns();
        console.log("Dropdowns initialized with supported currencies");
    } else {
        console.error("countryData not found. Make sure countries.js is loaded first.");
        showError("Currency data not loaded. Please refresh the page.");
    }
});

// Function to show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    errorMessage.style.color = "red";
    errorMessage.style.fontSize = "0.9rem";
    errorMessage.style.marginTop = "5px";
}

// Function to clear error message
function clearError() {
    errorMessage.textContent = "";
    errorMessage.style.display = "none";
}

// Function to show result message
function showResult(message, isSuccess = true) {
    msgBox.textContent = message;
    msgBox.style.display = "block";
    msgBox.style.color = isSuccess ? "green" : "red";
    msgBox.style.backgroundColor = isSuccess ? "lightskyblue" : "#ffcccc";
    msgBox.style.borderColor = isSuccess ? "#333" : "red";
}

// Function to hide result message
function hideResult() {
    msgBox.style.display = "none";
    msgBox.textContent = "";
}

// Function to get exchange rate from FreeCurrencyAPI with better error handling
async function getExchangeRate(fromCurrency, toCurrency, amount) {
    try {
        console.log(`API Call: ${BASE_URL}?apikey=${API_KEY}&base_currency=${fromCurrency}&currencies=${toCurrency}`);
        
        const response = await fetch(
            `${BASE_URL}?apikey=${API_KEY}&base_currency=${fromCurrency}&currencies=${toCurrency}`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        // Get the response text first to handle both success and error cases
        const responseText = await response.text();
        console.log("API Response Status:", response.status);
        console.log("API Response:", responseText);

        if (!response.ok) {

            if (response.status === 429) {
                return {
                    success: false,
                    message: "⚠️ Monthly API limit reached (1,500 requests).\nPlease try again next month."
                };
            }
            
            // Try to parse error message
            let errorMsg = `API Error ${response.status}`;
            try {
                const errorData = JSON.parse(responseText);
                errorMsg = errorData.message || errorData.detail || errorMsg;
            } catch (e) {
                // If not JSON, use the text
                if (responseText) errorMsg = responseText;
            }
            
            // Handle specific error codes
            if (response.status === 422) {
                errorMsg = "Invalid currency code. Please select supported currencies like USD, EUR, INR, etc.";
            } else if (response.status === 401) {
                errorMsg = "API key issue. Please check your API key.";
            } else if (response.status === 429) {
                errorMsg = "Rate limit exceeded. Please try again later.";
            }
            
            throw new Error(errorMsg);
        }

        // Parse successful response
        const data = JSON.parse(responseText);
        console.log("Parsed Data:", data);
        
        if (data.data && data.data[toCurrency]) {
            const rate = data.data[toCurrency];
            const convertedAmount = (amount * rate).toFixed(4);
            return {
                success: true,
                rate: rate,
                convertedAmount: convertedAmount,
                date: data.meta ? data.meta.last_updated_at : new Date().toISOString()
            };
        } else {
            return {
                success: false,
                message: "Currency conversion data not available in API response"
            };
        }
    } catch (error) {
        console.error("Detailed API Error:", error);
        return {
            success: false,
            message: error.message || "Error fetching exchange rate"
        };
    }
}

// Convert button click handler
btn.addEventListener('click', async (evt) => {
    evt.preventDefault();
    
    clearError();
    hideResult();
    
    let amountValue = parseFloat(amountInput.value);

    // Validation
    if (!amountInput.value.trim()) {
        showError("Please enter an amount!");
        return;
    }
    
    if (isNaN(amountValue)) {
        showError("Please enter a valid number!");
        return;
    }
    
    if (amountValue <= 0) {
        showError("Amount must be greater than 0!");
        return;
    }

    const fromVal = fromCurr.value;
    const toVal = toCurr.value;

    console.log("Conversion request:", { from: fromVal, to: toVal, amount: amountValue });

    if (!fromVal || !toVal) {
        showError("Please select both currencies!");
        return;
    }

    if (fromVal === toVal) {
        showError("Please select different currencies!");
        return;
    }

    showResult("Fetching exchange rate...", false);

    // Get exchange rate using FreeCurrencyAPI
    const result = await getExchangeRate(fromVal, toVal, amountValue);
    
    if (result.success) {
        try {
            const formattedDate = new Date(result.date).toLocaleDateString();
            showResult(
                `${amountValue} ${fromVal} = ${result.convertedAmount} ${toVal}\n(Rate: 1 ${fromVal} = ${result.rate} ${toVal})`,
                true
            );
        } catch (dateError) {
            // If date parsing fails, just show the conversion
            showResult(
                `${amountValue} ${fromVal} = ${result.convertedAmount} ${toVal}\n(Rate: 1 ${fromVal} = ${result.rate} ${toVal})`,
                true
            );
        }
    } else {
        showResult(result.message, false);
    }
});

// Real-time validation for amount input
amountInput.addEventListener('input', function() {
    if (this.value.trim()) {
        const value = parseFloat(this.value);
        if (isNaN(value)) {
            showError("Please enter a valid number!");
        } else if (value <= 0) {
            showError("Amount must be greater than 0!");
        } else {
            clearError();
        }
    } else {
        clearError();
    }
});

// Also validate on blur (when user leaves the input field)
amountInput.addEventListener('blur', function() {
    if (this.value.trim()) {
        const value = parseFloat(this.value);
        if (isNaN(value) || value <= 0) {
            showError("Please enter a valid amount (greater than 0)!");
        }
    }
});

// Initialize message box as hidden
msgBox.style.display = "none";

// Rate limiting warning
console.log("Using FreeCurrencyAPI - 1,500 free requests/month");

// Test API connection on load (optional)
async function testAPIConnection() {
    try {
        console.log("Testing API connection...");
        const testResponse = await fetch(`${BASE_URL}?apikey=${API_KEY}&base_currency=USD&currencies=EUR`);
        if (testResponse.ok) {
            console.log("✅ API connection successful");
        } else {
            console.warn("⚠️ API connection issue, status:", testResponse.status);
        }
    } catch (error) {
        console.error("❌ API test failed:", error.message);
    }
}

// Run API test after a short delay
setTimeout(testAPIConnection, 1000);