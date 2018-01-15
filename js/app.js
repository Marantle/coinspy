let thing = new Vue({
  el: '#app',
  data: {
    'coins': [],
    'filters': [],
    'changecolorprefix': 'change-color-',
    'currentSort': '',
    'updateThingy': 0,
    'ascending': false,
    'togglebgprefix': 'togglebg-',
    'filterText': '',
    'filters': []
  },
  watch: {
    'ascending': function (val, oldVal) {
      this.coins.sort((a, b) => compare(a, b, this.currentSort, this.ascending))
    },
    'filterText': function (val, oldVal) {
      this.filterCoins()
    }
  },
  methods: {
    sortCoins: function (property) {
      if (property) {
        this.currentSort = property
        this.coins.sort((a, b) => compare(a, b, property, this.ascending))
      }
    },
    filterCoins: function () {
      this.filters = []
      let filterString = this.filterText
      console.log(filterString)
      if (filterString.length > 0) {
        filterString = filterString.toUpperCase()
        console.log(`filtertext has length`)
        if (filterString.includes(',')) {
          console.log(`filtertext has comma`)
          this.filters = filterString.split(',')
        } else {
          this.filters.push(filterString)
        }
      }
      console.log(`filters ${this.filters}`)
      if (this.filters.length == 0) {
        this.coins.forEach((coin, index) => {
          this.coins[index].visible = true
        })
      } else {
        this.coins.forEach((coin, index) => {
          this.coins[index].visible = this.coinVisible(coin)
        })
      }
    },
    coinVisible: function (coin) {
      if (this.filters.length == 0) return true
      return this.filters.includes(coin.symbol)
    },
    updateCoins(coinDatas, updateThingy) {
      let vm = this
      console.log(`updated ${updateThingy}`)
      if (!updateThingy.includes("localstorage")) {
        localStorage.setItem('coinData', JSON.stringify(coinDatas))
        localStorage.setItem('updateTime', Date.now())
        console.log('set stuff to localstorage')
      }
      for (let coinData of coinDatas) {
        let { name, symbol, percent_change_1h, percent_change_24h, percent_change_7d, price_usd } = coinData
        let changecolor1h = redOrGreen(percent_change_1h)
        let changecolor24h = redOrGreen(percent_change_24h)
        let changecolor7d = redOrGreen(percent_change_7d)
        let allGreen = isAllSame(changecolor1h, changecolor24h, changecolor7d, 'green')
        let allRed = isAllSame(changecolor1h, changecolor24h, changecolor7d, 'red')
        let coinIx = vm.coins.findIndex(function (obj) { return obj.name === coinData.name; })
        let visible = vm.coinVisible(coinData)
        let newCoin = {
          name,
          symbol,
          price_usd,
          percent_change_1h,
          changecolor1h,
          percent_change_24h,
          changecolor24h,
          percent_change_7d,
          changecolor7d,
          allGreen,
          allRed,
          visible
        }
        if (coinIx === -1) {
          vm.coins.push(newCoin)
        } else {
          Vue.set(vm.coins, coinIx, newCoin)
        }
      }
      if (vm.currentSort.length > 0) {
        console.log(`currentsort is ${vm.currentSort}`)
        vm.coins.sort((a, b) => compare(a, b, vm.currentSort, vm.ascending))
      }
    },
    populateData: function () {
      let vm = this
      if (localStorage.getItem('coinData')) {
        let coinDatas = JSON.parse(localStorage.getItem('coinData'))
        vm.updateCoins(coinDatas, 'from localstorage')
      }
      if (localStorage.getItem('updateTime') && Date.now() - localStorage.getItem('updateTime') > 60 * 1000) {
        console.log(`localstorage data was ${(Date.now() - localStorage.getItem('updateTime')) / 1000} seconds old, update`)
        axios.get('https://api.coinmarketcap.com/v1/ticker/?limit=500')
          .then((response) => {
            let coinDatas = response.data
            vm.updateCoins(coinDatas, 'initially from interweb')
            console.log(vm.coins)
          })
          .catch((error) => {
            console.error(error)
            setTimeout(() => { vm.populateData() }, 500);
          })
      }
      setInterval(function () {
        axios.get('https://api.coinmarketcap.com/v1/ticker/?limit=500')
          .then((response) => {
            let coinDatas = response.data
            vm.updateThingy++
            vm.updateCoins(coinDatas, `by interval #${vm.updateThingy}`)
          })
          .catch((error) => {
            console.error(error)
            setTimeout(() => { vm.populateData() }, 500);
          })
      }, 10000)

    }
  },
  created: function () {
    this.populateData()
  }
})

function compare(a, b, prop, ascending) {
  let aa = parseFloat(a[prop]), bb = parseFloat(b[prop])
  if (ascending) {
    if (aa < bb)
      return -1;
    if (aa > bb)
      return 1;
  } else {
    if (aa > bb)
      return -1;
    if (aa < bb)
      return 1;
  }
  return 0;
}


function redOrGreen(c) {
  return (c > 1.0 ? 'green' : (c < -1.0 ? 'red' : ''))
}

function isAllSame(c1, c2, c3, color) {
  return c1 == color && c2 == color && c3 == color
}
