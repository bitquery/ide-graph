import SankeyEditor from './reactComponents/SankeyEditor'
import sankeyRenderer from './reactComponents/sankeyRenderer'
import GraphEditor from './reactComponents/GraphEditor'
import graphRenderer from './reactComponents/graphRenderer'
import checkAllProperties from './checkAllProperties'

class SankeyPlugin {
  constructor() {
    this.id = 'sankey'
    this.name = 'Sankey'
    this.editor = SankeyEditor
    this.renderer = sankeyRenderer
    this.dependencies = [
      'https://cdn.jsdelivr.net/npm/@bitquery/ide-graph@2.0.1/dist/sankeyRenderer.js',
      'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js'
    ]
  }
  supportsModel(model) {
    for (let key in model) {
			let isLack = false
      let coinpaths = []

      if (!key.includes('.') && model[key].selectionSet) {
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
        'receiver',
        'receiver.address',
        'receiver.annotation',
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
    this.renderer = graphRenderer
    this.dependencies = [
      'https://cdn.jsdelivr.net/npm/@bitquery/ide-graph@2.0.1/dist/graphRenderer.js',
      'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js',
      'https://kit.fontawesome.com/fcc9f09153.js'
    ]
  }
  supportsModel(model) {
    for (let key in model) {
			let isLack = false
      let coinpaths = []

      if (!key.includes('.') && model[key].selectionSet) {
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
        'receiver',
        'receiver.address',
        'receiver.annotation',
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
