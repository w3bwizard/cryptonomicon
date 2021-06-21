// validation scheme
    //validate by coin list
        // - valid
            // - validate by subscribe to usd
                // - valid
                    // - subscribe to usd
                // - invalid 
                    // - validate by subscribe to btc
                        // - valid 
                            // - subscribe to btc
                        // - invalid
                            // - set invalid status
        // - invalid 
            // - set invalid status

// Проблемы автодополнения
// - При добавлени невалидного тикера, вебсокет сходит с ума
// - Невалидные тикеры не удаляются
// - Если начать печатать сразу после загрузки страницы, список монет не успевает загрузится
//   и автодополнение не срабатывает
// - Нужно научится пользоватся scync aweit

const API_KEY = '74eea2552d64bb162020979867150f7c48bd83b30c10b95afae842e42ae12384'
const tickersHandlers = new Map()
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);
const coinList = []

socket.onopen = function() {
    sendToWS(
        {
        action: 'SubAdd',
        subs: ['5~CCCAGG~BTC~USD']
        }
    )
}

socket.onmessage = function(event) {
    let message = JSON.parse(event.data)
    
    if (message.TYPE === '5' 
        && tickersHandlers.has(message.FROMSYMBOL) 
        && message.TOSYMBOL === 'USD') {
        const handler = tickersHandlers.get(message.FROMSYMBOL)
        handler(message.FROMSYMBOL, message.PRICE)
    }
    if (message.TYPE === '5' 
        && message.FROMSYMBOL === 'BTC') {
        socket.BtcPrice = message.PRICE
    }
    if (message.TYPE === '500' 
        && message.MESSAGE === 'INVALID_SUB') {
        console.log(message.PARAMETER)
        subscribeToTickerOnWSToBTC(getSymbolFromParametr(message.PARAMETER))
    }
    if (message.TYPE === '5' 
        && message.TOSYMBOL === 'BTC') {
        console.log(message.FROMSYMBOL, message.PRICE)
    }
}

function getSymbolFromParametr(parameter) {
    // let re = new RegExp('5~CCCAGG~([\\s\\S]*)~USD')
    // let match = re.exec(parameter)
    // return match[1]
    return parameter.substring(parameter.lastIndexOf('CCCAGG~')+1,parameter.lastIndexOf('~USD'))
}

function sendToWS(msg){
    const stringifiedMsg = JSON.stringify(msg)

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMsg);
        return;
      }
    
      socket.addEventListener(
        "open",
        () => {
          socket.send(stringifiedMsg);
        },
        { once: true }
      );
        
}

function subscribeToTickerOnWSToBTC(tickerName){
    sendToWS(
        {
        action: 'SubAdd',
        subs: [`5~CCCAGG~${tickerName}~BTC`]
        }
    )
}

function subscribeToTickerOnWS(tickerName){
    sendToWS(
        {
        action: 'SubAdd',
        subs: [`5~CCCAGG~${tickerName}~USD`]
        }
    )
}

function unsubscribeFromTickerOnWS(tickerName){
    sendToWS(
        {
        action: 'SubRemove',
        subs: [`5~CCCAGG~${tickerName}~USD`]
        }
    )
}

export function subscribeToTicker(tickerName, cb) {
    tickersHandlers.set(tickerName, cb)
    subscribeToTickerOnWS(tickerName)
}

export function unsubscribeFromTicker(tickerName) {
    tickersHandlers.delete(tickerName)
    unsubscribeFromTickerOnWS(tickerName)    
}

export function getCoinList() {
    fetch('https://min-api.cryptocompare.com/data/all/coinlist')
    .then((response) => {
    return response.json();
    })
    .then((data) => {
    if (data) {
        coinList.slice(0, coinList.length)
        for (let item in data.Data) {
            let newCoin = {
            name: data.Data[item].FullName,
            symbol: data.Data[item].Symbol
            }
            coinList.push(newCoin)
        }
    }
    });    
}

export function getAutoComplete(tickerName) {
    if (tickerName && coinList.length > 0) {
    let result = coinList.filter(coin => {
        return coin.name.toLowerCase().includes(tickerName.toLowerCase())
    }).slice(0, 4)
        return result
    }else {
        return []
    }
}

export function validate(tickerName, cb) {
    if (validateByCoinList(tickerName)) {
        subscribeToTicker(tickerName, cb)
    } else {
        cb(tickerName, '-', false)
    }
}

function validateByCoinList(tickerName) {
    if (tickerName && coinList.length > 0) {
        let result = false

        if (coinList.find(coin => {
            return coin.symbol.toLowerCase() === tickerName.toLowerCase()
        })) {
            result = true
        } else {
            result = false
        }
        return result
    }
}

window.tickers = tickersHandlers
window.coinList = coinList


