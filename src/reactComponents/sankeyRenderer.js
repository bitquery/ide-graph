import _ from 'lodash'
import _n from 'numeral'
import * as d3 from 'd3'
import * as d3Sankey from '@bitquery/d3-sankey-circular'
import * as d3PathArrows from 'd3-path-arrows'
import uid from '../util/uid'

export default function sankeyRenderer(dataSource, options, selector) {
	const g = {}
	g.container = document.querySelector(`#${selector}`)
	const jqContainer = $(g.container)
  
	const values = Array.isArray(dataSource.values)
	  ? {
		  [dataSource.displayed_data.split('.')[1]]: dataSource.values,
		}
	  : Object.assign({}, dataSource.values)
  
	console.log(values)
  
	if (
	  !(values.inbound && values.inbound.length > 0) &&
	  !(values.outbound && values.outbound.length > 0)
	) {
	  jqContainer.empty()
	  return
	}
  
	const queryVariables = JSON.parse(dataSource.variables)
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
  
	g.theme = options.theme || 'light'
  
	if (g.theme == 'dark') {
	  jqContainer.addClass('dark')
	} else {
	  jqContainer.removeClass('dark')
	}
  
	g.render = () => {
	  jqWrapper.removeClass('initializing')
	  const width = $(`#${selector}`)
		.parent()
		.parent()
		.width()
	  const height = $(`#${selector}`)
		.parent()
		.parent()
		.height()
	  const edgeColor = 'path'
	  const textColor = options.theme == 'dark' ? 'white' : 'black'
	  const strokeColor = options.theme == 'dark' ? 'white' : 'black'
	  const linkOpacity = options.theme == 'dark' ? 1 : 0.85
	  const fontSize = 12
	  const graphSize = {}
  
	  const svg = d3
		.select(`#${selector}`)
		.append('svg')
		.attr('width', '100%')
		.attr('height', '100%')
  
	  const prepareData = (data) => {
		const getLabel = (node) => {
		  if (node.address == '0x0000000000000000000000000000000000000000') {
			// 'coinbase'
			return 'Coinbase'
		  } else if (
			node.smartContract &&
			node.smartContract.contractType == 'Generic'
		  ) {
			// 'smart_contract'
			return null
		  } else if (
			node.smartContract &&
			(node.smartContract.contractType == 'Token' ||
			  node.smartContract.contractType == 'TokenSale')
		  ) {
			// 'token'
			return (
			  node.smartContract.currency.name +
			  ' (' +
			  node.smartContract.currency.symbol +
			  ')'
			)
		  } else if (
			node.smartContract &&
			node.smartContract.contractType == 'MarginPositionToken'
		  ) {
			// 'MarginPositionToken'
			return node.annotation || null
		  } else if (
			node.smartContract &&
			node.smartContract.contractType == 'Multisig'
		  ) {
			// 'multisig'
			return node.annotation || null
		  } else if (
			node.smartContract &&
			node.smartContract.contractType == 'DEX'
		  ) {
			// 'dex'
			return node.annotation || null
		  } else {
			if (node.address == '') {
			  // 'coinbase'
			  return 'Coinbase'
			} else if (node.annotation) {
			  // 'annotated_address'
			  return node.annotation
			} else {
			  // 'address'
			  return null
			}
		  }
		}
  
		let links = []
		let nodes = []
  
		if (data.inbound) {
		  _.each(data.inbound, (item) => {
			links.push({
			  source: item.sender.address,
			  target: item.receiver.address,
			  amount: item.amount,
			  value: item.amount,
			  countOfTransfers: item.count,
			})
			nodes.push({
			  id: item.sender.address,
			  label: getLabel(item.sender),
			  depthLevel:
				item.sender.address == queryVariables.address ? 0 : -item.depth,
			  valueFromOneLink: item.amount,
			})
			nodes.push({
			  id: item.receiver.address,
			  label: getLabel(item.receiver),
			  depthLevel:
				item.receiver.address == queryVariables.address
				  ? 0
				  : -item.depth + 1,
			  valueFromOneLink: item.amount,
			})
		  })
		}
  
		if (data.outbound) {
		  _.each(data.outbound, (item) => {
			links.push({
			  source: item.sender.address,
			  target: item.receiver.address,
			  amount: item.amount,
			  value: item.amount,
			  countOfTransfers: item.count,
			})
			nodes.push({
			  id: item.sender.address,
			  label: getLabel(item.sender),
			  depthLevel:
				item.sender.address == queryVariables.address
				  ? 0
				  : item.depth - 1,
			  valueFromOneLink: item.amount,
			})
			nodes.push({
			  id: item.receiver.address,
			  label: getLabel(item.receiver),
			  depthLevel:
				item.receiver.address == queryVariables.address ? 0 : item.depth,
			  valueFromOneLink: item.amount,
			})
		  })
		}
  
		nodes = _.uniqBy(
		  _.sortBy(nodes, [(n) => -n.valueFromOneLink, (n) => n.depthLevel ** 2]),
		  'id'
		)
  
		const numberOnLevels = _.reduce(
		  nodes,
		  (result, n) => {
			result[n.depthLevel]
			  ? (result[n.depthLevel] += 1)
			  : (result[n.depthLevel] = 1)
			return result
		  },
		  {}
		)
		const maxVertical = _.max(_.values(numberOnLevels))
		const maxHorizontal = _.values(numberOnLevels).length
		graphSize.width = maxHorizontal * 650
		graphSize.height =
		  maxVertical * (300 - Math.min(200, Math.log10(maxVertical) * 100))
  
		return {
		  links,
		  nodes,
		  units: currency,
		}
	  }
	  const data = prepareData(values)
  
	  const colorSchemaOdd = d3.scaleOrdinal(d3.schemeCategory10.slice(5))
	  const colorSchemaEven = d3.scaleOrdinal(d3.schemeCategory10.slice(0, 5))
	  const color = (d) => {
		return d.column % 2 == 0
		  ? colorSchemaOdd(d.category === undefined ? d.id : d.category)
		  : colorSchemaEven(d.category === undefined ? d.id : d.category)
	  }
  
	  const format = data.units
		? (d) => `${_n(d).format('0.0000a')} ${data.units}`
		: (d) => `${_n(d).format('0.0000a')}`
  
	  const sankey = d3Sankey
		.sankeyCircular()
		.nodeId((d) => d.id)
		.nodeAlign(d3Sankey.sankeyFixed)
		.nodeWidth(50)
		.nodePaddingRatio(0.7)
		.circularLinkGap(15)
		.size([graphSize.width, graphSize.height])
  
	  g.sankey = sankey
  
	  const graph = sankey(data)
	  const rootNode = _.find(graph.nodes, { id: queryVariables.address })
  
	  function getAllPaths(graph) {
  
		const pathsFromRootToNodes = []
		function addSourceNodeToPath(node, path) {
		  if (node.id == rootNode.id || _.includes(path, node.id)) {
			if (!isDuplicate(pathsFromRootToNodes, path)) {
			  pathsFromRootToNodes.push([...path])
			}
		  } else if (node.sourceLinks.length == 0) {
			path.push(node.id)
			if (!isDuplicate(pathsFromRootToNodes, path)) {
			  pathsFromRootToNodes.push([...path])
			}
		  } else {
			path.push(node.id)
			if (!isDuplicate(pathsFromRootToNodes, path)) {
			  pathsFromRootToNodes.push([...path])
			}
			_.forEach(node.sourceLinks, (l) => {
			  addSourceNodeToPath(l.target, [...path])
			})
		  }
		}
  
		_.forEach(rootNode.sourceLinks, (l) => {
		  const path = [rootNode.id]
		  addSourceNodeToPath(l.target, path)
		})
  
		const pathsFromNodesToRoot = []
		function addTargetNodeToPath(node, path) {
		  if (node.id == rootNode.id || _.includes(path, node.id)) {
			if (!isDuplicate(pathsFromNodesToRoot, [...path].reverse())) {
			  pathsFromNodesToRoot.push([...path].reverse())
			}
		  } else if (node.targetLinks.length == 0) {
			path.push(node.id)
			if (!isDuplicate(pathsFromNodesToRoot, [...path].reverse())) {
			  pathsFromNodesToRoot.push([...path].reverse())
			}
		  } else {
			path.push(node.id)
			if (!isDuplicate(pathsFromNodesToRoot, [...path].reverse())) {
			  pathsFromNodesToRoot.push([...path].reverse())
			}
			_.forEach(node.targetLinks, (l) => {
			  const pathCopy = [...path]
			  addTargetNodeToPath(l.source, pathCopy)
			})
		  }
		}
  
		_.forEach(rootNode.targetLinks, (l) => {
		  const path = [rootNode.id]
		  addTargetNodeToPath(l.source, path)
		})
  
		return _.concat(pathsFromRootToNodes, pathsFromNodesToRoot)
	  }
	  const allPaths = getAllPaths(graph)
  
	  function isDuplicate(arrays, arr) {
		return _.some(arrays, (a) => {
		  return _.isEqual(arr, a)
		})
	  }
  
	  function getPaths(nodeId, allPaths, toNode = true) {
		const paths = []
		_.forEach(allPaths, (p) => {
		  const direction = toNode ? p.length - 1 : 0
		  if (_.indexOf(p, nodeId) == direction) {
			paths.push(p)
		  }
		})
		return paths
	  }
  
	  function getDataToHighlight(nodes, allPaths) {
		const dataToHighlight = {}
  
		_.forEach(nodes, (n) => {
		  // что подсвечивать: от рутового или до или все вместе
		  const paths = _.concat(
			getPaths(n.id, allPaths),
			getPaths(n.id, allPaths, false)
		  )
  
		  const nodesToHighlight = _.uniq(_.flattenDeep(paths))
		  const linksToHighlight = []
		  _.forEach(paths, (p) => {
			for (let i = 0; i < p.length - 1; i++) {
			  const couple = [p[i], p[i + 1]]
			  if (!isDuplicate(linksToHighlight, couple)) {
				linksToHighlight.push(couple)
			  }
			}
		  })
		  dataToHighlight[n.id] = { nodesToHighlight, linksToHighlight }
		})
		return dataToHighlight
	  }
  
	  const dataToHighlight = getDataToHighlight(graph.nodes, allPaths)
  
	  const rootG = svg.append('g').attr('class', 'root-g')
  
	  rootG
		.append('rect')
		.attr('class', 'divider')
		.attr('x', rootNode.x0)
		.attr('y', -10000)
		.attr('height', 20000)
		.attr('width', rootNode.x1 - rootNode.x0)
		.attr('fill', 'silver')
		.attr('opacity', 0.5)
  
	  const linkG = rootG
		.append('g')
		.attr('class', 'links')
		.attr('fill', 'none')
		.attr('stroke-opacity', linkOpacity)
		.selectAll('path')
  
	  const nodeG = rootG
		.append('g')
		.attr('class', 'nodes')
		.attr('font-family', 'sans-serif')
		.attr('font-size', fontSize)
		.selectAll('g')
  
	  const node = nodeG
		.data(graph.nodes)
		.enter()
		.append('g')
  
	  const tooltip = d3.select('.tooltip').empty()
		? d3
			.select('body')
			.append('div')
			.attr(
			  'class',
			  options.theme == 'dark' ? 'tooltip tooltip--dark' : 'tooltip'
			)
		: d3.select('.tooltip')
  
	  node
		.append('rect')
		.attr('x', (d) => d.x0)
		.attr('y', (d) => (d.y1 - d.y0 < 1 ? d.y0 - 0.5 : d.y0))
		.attr('height', (d) => (d.y1 - d.y0 < 1 ? 1 : d.y1 - d.y0))
		.attr('width', (d) => d.x1 - d.x0)
		.attr('fill', color)
		.attr('stroke', strokeColor)
		.attr('stroke-width', 1)
		.on('mouseover', nodeMouseOver)
		.on('mousemove', nodeMouseMove)
		.on('mouseout', nodeMouseOut)
		.on('contextmenu', nodeContextMenu)
  
	  node
		.append('text')
		.attr('x', (d) => (d.x0 + d.x1) / 2)
		.attr('y', (d) => d.y0 - 4)
		.attr('text-anchor', 'middle')
		.attr('fill', textColor)
		.attr('class', (d) => {
		  d.isHidden = false
		  return d.label ? 'annotation' : 'address'
		})
		.text(
		  (d) => d.label || _.truncate(d.id, { length: 15, separator: '...' })
		)
		.on('mouseover', nodeMouseOver)
		.on('mousemove', nodeMouseMove)
		.on('mouseout', nodeMouseOut)
		.on('contextmenu', nodeContextMenu)
  
	  const link = linkG
		.data(graph.links)
		.enter()
		.append('g')
  
	  if (edgeColor === 'path') {
		const gradient = link
		  .append('linearGradient')
		  .attr('id', (d) => (d.uid = uid('link')).id)
		  .attr('gradientUnits', 'userSpaceOnUse')
		  .attr('x1', (d) => d.source.x1)
		  .attr('x2', (d) => d.target.x0)
  
		gradient
		  .append('stop')
		  .attr('offset', '0%')
		  .attr('stop-color', (d) => color(d.source))
  
		gradient
		  .append('stop')
		  .attr('offset', '100%')
		  .attr('stop-color', (d) => color(d.target))
	  }
  
	  link
		.append('path')
		.attr('class', 'sankey-link')
		.attr('d', function(link) {
		  return link.path
		})
		.attr('stroke', (d) =>
		  edgeColor === 'none'
			? '#aaa'
			: edgeColor === 'path'
			? d.uid
			: edgeColor === 'input'
			? color(d.source)
			: color(d.target)
		)
		.attr('stroke-width', (d) => Math.max(1, d.width))
		.attr('opacity', 1)
		.on('mouseover', linkMouseOver)
		.on('mousemove', linkMouseMove)
		.on('mouseout', linkMouseOut)
  
	  let arrows = d3PathArrows
		.pathArrows()
		.arrowLength(10)
		.gapLength(150)
		.arrowHeadSize(4)
		.path(function(link) {
		  return link.path
		})
  
	  const arrowsG = linkG
		.data(graph.links)
		.enter()
		.append('g')
		.attr('class', 'g-arrow')
		.call(arrows)
  
	  arrowsG.select('path').style('stroke', strokeColor)
  
	  arrowsG.selectAll('.arrow-head').style('fill', strokeColor)
  
	  function highlightNode(node, id) {
		// isHidden, isHighlighted, isDarken,
		if (_.includes(dataToHighlight[id].nodesToHighlight, node.id)) {
		  node.isHighlighted = true
		} else {
		  node.isDarken = true
		}
	  }
  
	  function highlightLinks(link, id) {
		const highlight = _.some(
		  dataToHighlight[id].linksToHighlight,
		  (couple) => {
			return link.source.id == couple[0] && link.target.id == couple[1]
		  }
		)
		if (highlight) {
		  link.isHighlighted = true
		} else {
		  link.isDarken = true
		}
	  }
  
	  function getOpacity(elem, type) {
		let opacity
		switch (type) {
		  case 'node':
			opacity = elem.isHighlighted ? 1 : elem.isDarken ? 0.3 : 1
			break
  
		  case 'text':
			opacity = elem.isHighlighted
			  ? 1
			  : elem.isHidden
			  ? 0
			  : elem.isDarken
			  ? 0.3
			  : 1
			break
  
		  case 'link':
			opacity = elem.isHighlighted ? 1 : elem.isDarken ? 0.3 : 1
			break
  
		  default:
			break
		}
		return opacity
	  }
  
	  function nodeMouseOver(e, d) {
		let thisId = d.id
  
		node.selectAll('rect').style('opacity', (d) => {
		  highlightNode(d, thisId)
		  return getOpacity(d, 'node')
		})
  
		d3.selectAll('.sankey-link').style('opacity', (l) => {
		  highlightLinks(l, thisId)
		  return getOpacity(l, 'link')
		})
  
		node.selectAll('text').style('opacity', (d) => {
		  return getOpacity(d, 'text')
		})
  
		let income = 0
		_.each(d.targetLinks, (l) => {
		  income += l.amount
		})
		let outcome = 0
		_.each(d.sourceLinks, (l) => {
		  outcome += l.amount
		})
  
		tooltip.style('visibility', 'visible').html(
		  `<ul>
					  ${income != 0 ? `<li>Income: ${format(income)}</li>` : ''}
					  ${outcome != 0 ? `<li>Outcome: ${format(outcome)}</li>` : ''}
					  <li>${d.label || d.id}</li>
				  </ul>`
		)
	  }
  
	  function nodeMouseMove(e, d) {
		const bodyWidth = d3
		  .select('body')
		  .style('width')
		  .slice(0, -2)
		const tooltipheight = e.pageY - tooltip.style('height').slice(0, -2) - 10
		const tooltipWidth = tooltip.style('width').slice(0, -2)
		const tooltipX =
		  e.pageX < tooltipWidth / 2
			? 0
			: e.pageX + tooltipWidth / 2 > bodyWidth
			? bodyWidth - tooltipWidth
			: e.pageX - tooltipWidth / 2
  
		tooltip.style('top', tooltipheight + 'px').style('left', tooltipX + 'px')
	  }
  
	  function nodeMouseOut(e, d) {
		node.selectAll('rect').style('opacity', (d) => {
		  d.isHighlighted = false
		  d.isDarken = false
		  return getOpacity(d, 'node')
		})
		link.selectAll('.sankey-link').style('opacity', (l) => {
		  l.isHighlighted = false
		  l.isDarken = false
		  return getOpacity(d, 'link')
		})
		node.selectAll('text').style('opacity', (d) => {
		  return getOpacity(d, 'text')
		})
		tooltip.style('visibility', 'hidden')
	  }
  
	  function nodeContextMenu(e, d) {
		e.preventDefault()
		const pathname = window.location.pathname.slice(1)
		window.open(
		  `${window.location.origin}/${pathname.slice(
			0,
			pathname.indexOf('/')
		  )}/address/${d.id}`,
		  '_blank'
		)
	  }
  
	  function linkMouseOver(e, l) {
		let source = l.source.id
		let target = l.target.id
  
		link.selectAll('.sankey-link').style('opacity', (l) => {
		  if (l.source.id == source && l.target.id == target) {
			l.isHighlighted = true
		  } else {
			l.isDarken = true
		  }
		  return getOpacity(l, 'link')
		})
  
		node.selectAll('rect').style('opacity', (d) => {
		  if (d.id == source || d.id == target) {
			d.isHighlighted = true
		  } else {
			d.isDarken = true
		  }
		  return getOpacity(d, 'node')
		})
  
		node.selectAll('text').style('opacity', (d) => {
		  return getOpacity(d, 'text')
		})
  
		tooltip.style('visibility', 'visible').html(
		  `<ul>
					  <li>Amount: ${format(l.amount)}</li>
					  <li>From:</li>
					  <li>${l.source.label || l.source.id}</li>
					  <li>To:</li>
					  <li>${l.target.label || l.target.id}</li>
					  <li>Count of transfers: ${l.countOfTransfers}</li>
				  </ul>`
		)
	  }
  
	  function linkMouseMove(e, l) {
		const bodyWidth = d3
		  .select('body')
		  .style('width')
		  .slice(0, -2)
		const tooltipheight = e.pageY - tooltip.style('height').slice(0, -2) - 10
		const tooltipWidth = tooltip.style('width').slice(0, -2)
		const tooltipX =
		  e.pageX < tooltipWidth / 2
			? 0
			: e.pageX + tooltipWidth / 2 > bodyWidth
			? bodyWidth - tooltipWidth
			: e.pageX - tooltipWidth / 2
  
		tooltip.style('top', tooltipheight + 'px').style('left', tooltipX + 'px')
	  }
  
	  function linkMouseOut(e, l) {
		node.selectAll('rect').style('opacity', (d) => {
		  d.isHighlighted = false
		  d.isDarken = false
		  return getOpacity(d, 'node')
		})
		link.selectAll('.sankey-link').style('opacity', (l) => {
		  l.isHighlighted = false
		  l.isDarken = false
		  return getOpacity(l, 'link')
		})
		node.selectAll('text').style('opacity', (d) => {
		  return getOpacity(d, 'text')
		})
		tooltip.style('visibility', 'hidden')
	  }
  
	  const zoom = d3
		.zoom()
		.on('zoom', function(e) {
		  rootG.select('.nodes').attr('font-size', fontSize / e.transform.k)
		  if (fontSize / e.transform.k > 36) {
			node.selectAll('.address').style('opacity', (d) => {
			  d.isHidden = true
			  return getOpacity(d, 'text')
			})
		  } else {
			node.selectAll('.address').style('opacity', (d) => {
			  d.isHidden = false
			  return getOpacity(d, 'text')
			})
		  }
		  rootG
			.select('.divider')
			.attr('y', (d) => -10000 / e.transform.k)
			.attr('height', 20000 / e.transform.k)
		  rootG.attr('transform', e.transform)
		})
		.on('start', function(e) {
		  if (e.sourceEvent && e.sourceEvent.type == 'mousedown') {
			svg.attr('cursor', 'move')
		  }
		})
		.on('end', function(e) {
		  if (e.sourceEvent && e.sourceEvent.type == 'mouseup') {
			svg.attr('cursor', 'default')
		  }
		})
  
	  const initScale =
		(Math.min(width / graphSize.width, height / graphSize.height) * 3) / 4
  
	  svg
		.call(zoom)
		.call(
		  zoom.transform,
		  d3.zoomIdentity
			.translate((width - graphSize.width * initScale) / 2, 120)
			.scale(initScale)
		)
		.on('dblclick.zoom', null)
  
	  const chart = svg.node()
	  $(`#${selector}`).html(chart)
	}
  
	g.render()

	return g
  }

window.sankeyRenderer = sankeyRenderer
