// const API_KEY = '3461ad4efdb1754b43f74f8b6ac3a83a6362f55e152bcdabf3d2ff1714990abe'

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
    })
}

