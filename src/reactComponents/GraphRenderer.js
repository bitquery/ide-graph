import React, { useEffect } from 'react'
import { address_graph } from '../lib'

function GraphRenderer({ el, config, dataSource, displayedData, children }) {
  useEffect(() => {
    if (dataSource && config && config.data && dataSource.data) {
      try {
        el &&
          address_graph('#' + el, dataSource, displayedData, {
            theme: config.theme,
          })
      } catch (error) {
        console.log(error)
      }
    }
  }, [JSON.stringify(config), JSON.stringify(dataSource)])
  if (!dataSource) return <div></div>
  return (
    <>
      {children}
      <div style={{ width: '100%', overflowY: 'hidden' }} id={el} key={el} />
    </>
  )
}

export default GraphRenderer
