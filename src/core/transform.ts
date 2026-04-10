import { readFile } from 'node:fs/promises'
import { parseHTML } from 'linkedom'
import { XmlParser, Xslt } from 'xslt-processor'

export const embed = (layout: string, itemID: string, transformedXml: string) => {
  const { document } = parseHTML(layout)
  const container = document.getElementById(itemID) || document.querySelector(`[id="${itemID}"]`) || document.body

  if (container) {
    container.innerHTML = transformedXml
  }

  return document.toString()
}

export const transform = async (xmlPath: string, transformPath: string) => {
  if (!xmlPath) {
    throw new Error('xmlPath is required')
  }
  if (!transformPath) {
    throw new Error('transformPath is required')
  }

  const xmlContent = await readFile(xmlPath, 'utf-8')
  const xsltContent = await readFile(transformPath, 'utf-8')

  const xmlParser = new XmlParser()
  const xslt = new Xslt({
    outputMethod: 'html',
    selfClosingTags: false
  })

  return xslt.xsltProcess(
    xmlParser.xmlParse(xmlContent),
    xmlParser.xmlParse(xsltContent)
  )
}
