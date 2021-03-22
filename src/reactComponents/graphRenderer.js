import _ from 'lodash'
import _n from 'numeral'
import { Network, DataSet } from '../../node_modules/vis'
import { lightenOrDarkenColor } from '../util/lightenOrDarkenColor'
import regeneratorRuntime from "regenerator-runtime"

export default async function graphRenderer(dataSource, options, selector) {
	const g = {}
	g.container = document.querySelector(`#${selector}`)
	const jqContainer = $(g.container)
  
	let value = undefined
	if (!dataSource.values) {
		const data = await dataSource.fetcher()
		const json = await data.json()
		value = dataSource.setupData(json)
	} else {
		value = dataSource.values
	}
	  const values = Array.isArray(value)
	  ? {
		  [dataSource.displayed_data.split('.')[1]]: value,
		}
	  : Object.assign({}, value)
  
  
	if (
	  !(values.inbound && values.inbound.length > 0) &&
	  !(values.outbound && values.outbound.length > 0)
	) {
	  jqContainer.empty()
	  return
	}
  
	const queryVariables = typeof dataSource.variables === 'object' ? dataSource.variables : JSON.parse(dataSource.variables)
	const currency =
	  (values.inbound &&
		values.inbound.length > 0 &&
		values.inbound[0].currency.symbol) ||
	  (values.outbound &&
		values.outbound.length > 0 &&
		values.outbound[0].currency.symbol)
  
	jqContainer.addClass('graph')
	if (!jqContainer.parent().hasClass('wrapper')) {
	  jqContainer.wrap('<div class="wrapper" style="width:100%; height:100%;">')
	}
	const jqWrapper = jqContainer.parent('.wrapper')
  
	// a trick for the icons in the graph to be loaded
	jqContainer.append(
	  '<i class="fa fa-flag" style="visibility:hidden;position:absolute;"></i>'
	)
  
	g.theme = options.theme || 'light'
  
	if (g.theme == 'dark') {
	  jqContainer.addClass('dark')
	} else {
	  jqContainer.removeClass('dark')
	}
  
	g.networkOptions = {
	  height: '100%',
	  physics: {
		stabilization: {
		  enabled: false,
		  iterations: 10,
		  onlyDynamicEdges: true,
		},
		barnesHut: {
		  damping: 0.4,
		  avoidOverlap: 0.1,
		  springConstant: 0.09,
		},
	  },
	  interaction: {
		hover: true,
		hoverConnectedEdges: false,
	  },
	}
  
	g.hashCode = (data) => {
	  var string = JSON.stringify(data)
	  if (Array.prototype.reduce) {
		return string.split('').reduce(function(a, b) {
		  a = (a << 5) - a + b.charCodeAt(0)
		  return a & a
		}, 0)
	  }
	  var hash = 0
	  if (string.length === 0) return hash
	  for (var i = 0; i < string.length; i++) {
		var character = string.charCodeAt(i)
		hash = (hash << 5) - hash + character
		hash = hash & hash
	  }
	  return hash
	}
  
	g.prepareNodes = (nodes) => {
	  if (!nodes) return []
	  const prepareNode = (node) => {
		if (node.address == '0x0000000000000000000000000000000000000000') {
		  // 'coinbase'
		  return {
			id: node.address,
			label: 'Coinbase',
			title: node.address,
			shape: 'icon',
			icon: {
			  face: 'FontAwesome',
			  code: '\uf0ac',
			  weight: 900,
			  size: 40,
			  color: '#03a9f4',
			},
			font: {
			  color: g.theme == 'dark' ? 'white' : 'black',
			},
		  }
		} else if (
		  node.smartContract &&
		  node.smartContract.contractType == 'Generic'
		) {
		  // 'smart_contract'
		  return {
			id: node.address,
			label: _.truncate(node.address, { length: 15, separator: '...' }),
			title: 'Smart Contract ' + node.address,
			shape: 'icon',
			icon: {
			  face: 'FontAwesome',
			  code: '\uf013',
			  weight: 900,
			  size: 40,
			  color: '#f0a30a',
			},
			font: {
			  color: g.theme == 'dark' ? 'white' : 'black',
			},
		  }
		} else if (
		  node.smartContract &&
		  (node.smartContract.contractType == 'Token' ||
			node.smartContract.contractType == 'TokenSale')
		) {
		  // 'token'
		  return {
			id: node.address,
			label:
			  node.smartContract.currency.name +
			  ' (' +
			  node.smartContract.currency.symbol +
			  ')',
			title:
			  node.smartContract.currency.name +
			  ' (' +
			  node.smartContract.currency.symbol +
			  ')' +
			  ' ' +
			  node.address,
			shape: 'icon',
			icon: {
			  face: 'FontAwesome',
			  code: '\uf51f',
			  weight: 900,
			  size: 40,
			  color: '#ff5722',
			},
			font: {
			  color: g.theme == 'dark' ? 'white' : 'black',
			},
		  }
		} else if (
		  node.smartContract &&
		  node.smartContract.contractType == 'MarginPositionToken'
		) {
		  // 'MarginPositionToken'
		  return {
			id: node.address,
			label:
			  node.annotation ||
			  _.truncate(node.address, { length: 15, separator: '...' }),
			title: 'MarginPositionToken ' + node.address,
			shape: 'icon',
			icon: {
			  face: 'FontAwesome',
			  code: '\uf1b2',
			  weight: 900,
			  size: 40,
			  color: '#ff5722',
			},
			font: {
			  color: g.theme == 'dark' ? 'white' : 'black',
			},
		  }
		} else if (
		  node.smartContract &&
		  node.smartContract.contractType == 'Multisig'
		) {
		  return {
			// 'multisig'
			id: node.address,
			label:
			  node.annotation ||
			  _.truncate(node.address, { length: 15, separator: '...' }),
			title: 'MultiSig Wallet ' + node.address,
			shape: 'icon',
			icon: {
			  face: 'FontAwesome',
			  code: '\uf4d3',
			  weight: 900,
			  size: 40,
			  color: '#03a9f4',
			},
			font: {
			  color: g.theme == 'dark' ? 'white' : 'black',
			},
		  }
		} else if (
		  node.smartContract &&
		  node.smartContract.contractType == 'DEX'
		) {
		  // 'dex'
		  return {
			id: node.address,
			label:
			  node.annotation ||
			  _.truncate(node.address, { length: 15, separator: '...' }),
			title: 'DEX ' + node.address,
			shape: 'icon',
			icon: {
			  face: 'FontAwesome',
			  code: '\uf021',
			  weight: 900,
			  size: 40,
			  color: '#03a9f4',
			},
			font: {
			  color: g.theme == 'dark' ? 'white' : 'black',
			},
		  }
		} else {
		  if (node.address == '') {
			// 'coinbase'
			return {
			  id: node.address,
			  label: 'Coinbase',
			  title: node.address,
			  shape: 'icon',
			  icon: {
				face: 'FontAwesome',
				code: '\uf0ac',
				weight: 900,
				size: 40,
				color: '#03a9f4',
			  },
			  font: {
				color: g.theme == 'dark' ? 'white' : 'black',
			  },
			}
		  } else if (node.annotation) {
			// 'annotated_address'
			return {
			  id: node.address,
			  label: node.annotation,
			  title: node.address,
			  shape: 'icon',
			  icon: {
				face: 'FontAwesome',
				code: '\uf007',
				weight: 900,
				size: 40,
				color: g.theme == 'dark' ? '#00967b' : '#009183',
			  },
			  font: {
				background: g.theme == 'dark' ? '#00967b' : '#009183',
				color: '#ffffff',
			  },
			}
		  } else {
			// 'address'
			return {
			  id: node.address,
			  label: _.truncate(node.address, { length: 15, separator: '...' }),
			  title: node.address,
			  shape: 'icon',
			  icon: {
				face: 'FontAwesome',
				code: '\uf007',
				weight: 900,
				size: 40,
				color: g.theme == 'dark' ? '#009b77' : '#009688',
			  },
			  font: {
				color: g.theme == 'dark' ? 'white' : 'black',
			  },
			}
		  }
		}
	  }
  
	  const prepared = []
	  _.each(nodes, function(node) {
		prepared.push(prepareNode(node.receiver))
		prepared.push(prepareNode(node.sender))
	  })
	  return prepared
	}
  
	g.prepareEdges = (edges, receiver = true) => {
	  if (!edges) return []
	  const prepareEdge = (edge) => {
		let currency_name = currency
		let width = edge.amount > 1 ? 1.5 * Math.log10(edge.amount) + 1 : 1
		let value =
		  parseFloat(edge.amount) <= 1e-6
			? edge.amount
			: _n(edge.amount).format('0.0000a')
  
		let label = value + ' ' + currency_name
  
		if (receiver) {
		  return {
			from: edge.sender.address,
			to: edge.receiver.address,
			arrows: 'to',
			label: label,
			color: {
			  color: g.theme == 'dark' ? 'silver' : 'grey',
			  highlight: '#ff5722',
			},
			font: {
			  align: 'middle',
			  multi: true,
			  color: g.theme == 'dark' ? 'white' : 'black',
			  strokeWidth: 4,
			  strokeColor: g.theme == 'dark' ? 'black' : 'white',
			},
			smooth: true,
			width: width,
			select_type: 'select_transfers',
			hidden: false,
			id: g.hashCode([
			  'select_transfers',
			  edge.sender.address,
			  edge.receiver.address,
			  label,
			]),
		  }
		} else {
		  return {
			from: edge.sender.address,
			to: edge.receiver.address,
			arrows: 'to',
			label: label,
			color: {
			  color: g.theme == 'dark' ? 'white' : 'black',
			  highlight: '#ff5722',
			},
			font: {
			  align: 'middle',
			  multi: true,
			  color: g.theme == 'dark' ? 'white' : 'black',
			  strokeWidth: 4,
			  strokeColor: g.theme == 'dark' ? 'black' : 'white',
			},
			smooth: true,
			width: width,
			select_type: 'select_transfers',
			hidden: false,
			id: g.hashCode([
			  'select_transfers',
			  edge.sender.address,
			  edge.receiver.address,
			  label,
			]),
		  }
		}
	  }
	  const prepared = []
	  _.each(edges, function(edge) {
		prepared.push(prepareEdge(edge))
	  })
	  return prepared
	}
  
	g.setDataset = (data) => {
	  if (!g.dataset) {
		g.dataset = {
		  nodes: new DataSet(),
		  edges: new DataSet(),
		}
	  }
	  g.dataset.nodes.clear()
	  g.dataset.edges.clear()
  
	  _.each(
		_.uniqBy(
		  g.prepareNodes(data.inbound).concat(g.prepareNodes(data.outbound)),
		  'id'
		),
		(node) => {
		  g.dataset.nodes.add(node)
		}
	  )
	  _.each(
		_.uniqBy(
		  g
			.prepareEdges(data.inbound)
			.concat(g.prepareEdges(data.outbound, false)),
		  'id'
		),
		(edge) => {
		  g.dataset.edges.add(edge)
		}
	  )
	}
  
	g.expandNode = (address) => {
	  const node = g.dataset.nodes.get(address)
	  if (!node.expanded) {
		node.expanded = true
		const prevColor = node.icon.color
		node.physics = false
		node.icon = {
		  color: lightenOrDarkenColor(prevColor, 20, g.theme == 'dark'),
		}
		if (g.theme == 'dark') {
		  node.shadow = {
			enabled: true,
			color: prevColor,
			size: 20,
			x: 0,
			y: 0,
		  }
		}
  
		g.dataset.nodes.update(node)
	  }
	}
  
	g.expandDataset = () => {
	  _.each(
		_.uniqBy(
		  g
			.prepareNodes(query.data[query.cryptoCurrency].inbound)
			.concat(g.prepareNodes(query.data[query.cryptoCurrency].outbound)),
		  'id'
		),
		(node) => {
		  if (!g.dataset.nodes.get(node.id)) {
			g.dataset.nodes.add(node)
		  }
		}
	  )
	  _.each(
		_.uniqBy(
		  g
			.prepareEdges(query.data[query.cryptoCurrency].inbound)
			.concat(
			  g.prepareEdges(query.data[query.cryptoCurrency].outbound, false)
			),
		  'id'
		),
		(edge) => {
		  if (!g.dataset.edges.get(edge.id)) {
			g.dataset.edges.add(edge)
		  }
		}
	  )
	}
  
	g.expand = (address) => {
	  const node = g.dataset.nodes.get(address)
	  if (!node.expanded) {
		g.expandNode(address)
		query.request({ address: address }, true, false)
	  }
	}
  
	g.initGraph = () => {
	  jqWrapper.removeClass('initializing')
	  g.setDataset(values)
  
	  g.network = new Network(g.container, g.dataset, g.networkOptions)
  
	  g.network.on('dragStart', function(params) {
		if (params.nodes.length != 0) {
		  g.network.canvas.body.container.style.cursor = 'grabbing'
		} else {
		  g.network.canvas.body.container.style.cursor = 'move'
		}
	  })
  
	  g.network.on('dragEnd', (params) => {
		if (params.nodes.length != 0) {
		  g.network.canvas.body.container.style.cursor = 'grab'
		} else {
		  g.network.canvas.body.container.style.cursor = 'default'
		}
		const nodeId = params.nodes[0]
		const clickedNode = g.dataset.nodes.get(nodeId)
		clickedNode.physics = false
		g.dataset.nodes.update(clickedNode)
	  })
  
	  g.network.on('hold', function(params) {
		if (params.nodes.length != 0) {
		  g.network.canvas.body.container.style.cursor = 'grabbing'
		} else {
		  g.network.canvas.body.container.style.cursor = 'move'
		}
	  })
  
	  g.network.on('release', function(params) {
		if (params.nodes.length != 0) {
		  g.network.canvas.body.container.style.cursor = 'grabbing'
		} else {
		  g.network.canvas.body.container.style.cursor = 'default'
		}
	  })
  
	  g.network.on('hoverNode', function(params) {
		g.network.canvas.body.container.style.cursor = 'grab'
	  })
  
	  g.network.on('blurNode', function(params) {
		g.network.canvas.body.container.style.cursor = 'default'
	  })
  
	  g.network.on('oncontext', function(params) {
		event.preventDefault()
		let nodeId = g.network.getNodeAt(params.pointer.DOM)
		if (nodeId) {
		  let node = g.dataset.nodes.get(nodeId)
		  const pathname = window.location.pathname.slice(1)
		  window.open(
			`${window.location.origin}/${pathname.slice(
			  0,
			  pathname.indexOf('/')
			)}/address/${node.id}`,
			'_blank'
		  )
		}
	  })
  
	  if (g.dataset.nodes.length == 0) return
  
	  g.expandNode(queryVariables.address)
	}
  
	g.initGraph()
	return g
  }

window.graphRenderer = graphRenderer
