const API_KEY = '74eea2552d64bb162020979867150f7c48bd83b30c10b95afae842e42ae12384'

function getSubscribeList(tickersList) {
    if (tickersList.length > 0) {
        return  tickersList.map(function(element){
            return element.name.toUpperCase()
        }).join(',')
    } else {
        return ''
    }
}

export function updateTickersPrice(tickersList) {
    
    const SUBSCRIBE_LIST = getSubscribeList(tickersList)

    return new Promise(function(resolve){
        if (SUBSCRIBE_LIST != ''){
            let newTickerList = []
            fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${SUBSCRIBE_LIST}&tsyms=USD&api_key=3461ad4efdb1754b43f74f8b6ac3a83a6362f55e152bcdabf3d2ff1714990abe`)
                .then((response) => {
                    return response.json()
                })
                .then((data) => {
                    if (data.Response === 'Error') {
                        resolve([])
                    } else {
                        for (const item in data) {
                            let newCoin = {
                                name: item,
                                price: data[item].USD
                            }
                            newTickerList.push(newCoin)
                        }
                        resolve(newTickerList)
                    }
                })
        }
    })
}

export function ws_test() {
    let socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);

    socket.onopen = function() {
        let msg = {
            action: 'SubAdd',
            subs: ['5~CCCAGG~BTC~USD']
        }
        console.log('socket open')
        socket.send(JSON.stringify(msg))
    }

    socket.onmessage = function(event) {
        console.log(`Данные сервера: ${event.data}`)
        let price = JSON.parse(event.data)
        if (price.TYPE === '5' && price.PRICE != undefined) {
            let data = [price.FROMSYMBOL, price.PRICE]
            console.log(data)
        }
    }
}

