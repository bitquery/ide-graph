import SankeyEditor from './reactComponents/SankeyEditor'
import SankeyRenderer from './reactComponents/SankeyRenderer'
import GraphEditor from './reactComponents/GraphEditor'
import GraphRenderer from './reactComponents/GraphRenderer'
import checkAllProperties from './checkAllProperties'

class SankeyPlugin {
  constructor() {
    this.id = 'sankey'
    this.name = 'Sankey'
    this.editor = SankeyEditor
    this.renderer = SankeyRenderer
  }
  supportsModel(model) {
    for (let key in model) {
			let isLack = false
      let coinpaths = []

      if (!key.includes('.')) {
        coinpaths.push(...model[key].selectionSet.selections)
      } else if (
        model[key].typeInfo.toString()[0] === '[' &&
        model[key].typeInfo.toString().slice(-2, -1) !== '0'
      ) {
        coinpaths.push(model[key])
      } else {
        return false
      }

      const properties = [
        'sender',
        'sender.address',
        'sender.annotation',
        'sender.smartContract',
        'sender.smartContract.contractType',
        'sender.smartContract.currency',
        'sender.smartContract.currency.symbol',
        'sender.smartContract.currency.name',
        'receiver',
        'receiver.address',
        'receiver.annotation',
        'receiver.smartContract',
        'receiver.smartContract.contractType',
        'receiver.smartContract.currency',
        'receiver.smartContract.currency.symbol',
        'receiver.smartContract.currency.name',
        'amount',
        'currency',
        'currency.symbol',
        'depth',
        'count',
      ]

      coinpaths.forEach((item) => {
				if (!checkAllProperties(properties, item)) isLack = true
			})

			return !isLack
    }
  }
}

class GraphPlugin {
  constructor() {
    this.id = 'graph'
    this.name = 'Graph'
    this.editor = GraphEditor
    this.renderer = GraphRenderer
  }
  supportsModel(model) {
    for (let key in model) {
			let isLack = false
      let coinpaths = []

      if (!key.includes('.')) {
        coinpaths.push(...model[key].selectionSet.selections)
      } else if (
        model[key].typeInfo.toString()[0] === '[' &&
        model[key].typeInfo.toString().slice(-2, -1) !== '0'
      ) {
        coinpaths.push(model[key])
      } else {
        return false
      }
      const properties = [
        'sender',
        'sender.address',
        'sender.annotation',
        'sender.smartContract',
        'sender.smartContract.contractType',
        'sender.smartContract.currency',
        'sender.smartContract.currency.symbol',
        'sender.smartContract.currency.name',
        'receiver',
        'receiver.address',
        'receiver.annotation',
        'receiver.smartContract',
        'receiver.smartContract.contractType',
        'receiver.smartContract.currency',
        'receiver.smartContract.currency.symbol',
        'receiver.smartContract.currency.name',
        'amount',
        'currency',
        'currency.symbol',
        'depth',
        'count',
      ]

      coinpaths.forEach((item) => {
				if (!checkAllProperties(properties, item)) isLack = true
			})

			return !isLack
    }
  }
}

export let graphPlugins = [new SankeyPlugin(), new GraphPlugin()]
