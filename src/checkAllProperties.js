export default function checkAllProperties(props, model) {
  const availableProps = new Set()
  function addProp(pre, item) {
    if (item.selectionSet) {
      item.selectionSet.selections.forEach((i) => {
				const start = pre ? pre + '.' : ''
        availableProps.add(start + item.name.value)
        addProp(start + item.name.value, i)
      })
    } else {
			const start = pre ? pre + '.' : ''
      availableProps.add(start + item.name.value)
    }
  }
  if (model.selectionSet) {
    model.selectionSet.selections.forEach((item) => {
      addProp('', item)
    })
	}
	
  function isSuperset(set, subset) {
    for (var elem of subset) {
      if (!set.has(elem)) {
        return false
      }
    }
    return true
	}

  return isSuperset(availableProps, new Set(props))
}