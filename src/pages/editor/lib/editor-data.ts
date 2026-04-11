/**
 * @title pages/editor/lib/editor-data.ts
 * @descrption Editor-local serializer/parser that maps JSON folder data to XML group nodes and back.
 */
import { XmlParser } from 'xslt-processor'

export type EditorField = {
  name: string
  type: string
  required?: boolean
}

export type EditorApi = {
  name: string
  method: string
  path: string
  requestBody?: EditorField[]
  responseBody?: EditorField[]
}

export type EditorFolder = {
  name: string
  apis?: EditorApi[]
}

export type EditorVar = {
  name: string
  value: string
}

export type EditorData = {
  env?: {
    vars?: EditorVar[]
  }
  folders?: EditorFolder[]
}

type ParsedXmlNode = {
  nodeType?: number
  nodeName?: string
  nodeValue?: string
  childNodes?: ParsedXmlNode[]
  firstChild?: ParsedXmlNode | null
  nextSibling?: ParsedXmlNode | null
  documentElement?: ParsedXmlNode
}

const DEFAULT_ENV: EditorVar[] = [
  { name: 'API_URL', value: 'https://api.example.com' }
]

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const attr = (name: string, value: string) => `${name}="${escapeXml(value)}"`

const safeText = (value: unknown, fallback = '') => {
  if (typeof value !== 'string') return fallback
  return value.trim()
}

const fieldXml = (field: EditorField, includeRequired: boolean) => {
  const name = safeText(field.name)
  const type = safeText(field.type, 'string')
  if (!name) return ''

  if (includeRequired) {
    const required = field.required ? 'true' : 'false'
    return `          <field ${attr('name', name)} ${attr('type', type)} ${attr('required', required)} />`
  }

  return `          <field ${attr('name', name)} ${attr('type', type)} />`
}

const apiXml = (api: EditorApi) => {
  const name = safeText(api.name, 'api')
  const method = safeText(api.method, 'GET').toUpperCase()
  const path = safeText(api.path, '/')

  const requestBody = (api.requestBody ?? [])
    .map((field) => fieldXml(field, true))
    .filter(Boolean)
    .join('\n')

  const responseBody = (api.responseBody ?? [])
    .map((field) => fieldXml(field, false))
    .filter(Boolean)
    .join('\n')

  return [
    `    <api ${attr('name', name)} ${attr('method', method)} ${attr('path', path)}>` ,
    '      <request>',
    '        <body>',
    requestBody,
    '        </body>',
    '      </request>',
    '      <response>',
    '        <body>',
    responseBody,
    '        </body>',
    '      </response>',
    '    </api>'
  ]
    .filter((line) => line !== '')
    .join('\n')
}

const folderXml = (folder: EditorFolder) => {
  const name = safeText(folder.name, 'default')
  const apis = folder.apis ?? []
  const renderedApis = apis.map((api) => apiXml(api)).join('\n')

  return [
    `  <group ${attr('name', name)}>`,
    renderedApis,
    '  </group>'
  ]
    .filter((line) => line !== '')
    .join('\n')
}

export const editorDataToXml = (data: EditorData) => {
  const envVars = data.env?.vars?.length ? data.env.vars : DEFAULT_ENV
  const folders = data.folders ?? []

  const envXml = envVars
    .map((item) => {
      const name = safeText(item.name)
      const value = safeText(item.value)
      if (!name) return ''
      return `    <var ${attr('name', name)} ${attr('value', value)} />`
    })
    .filter(Boolean)
    .join('\n')

  const foldersXml = folders
    .map((folder) => folderXml(folder))
    .filter(Boolean)
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<collection>',
    '  <env>',
    envXml,
    '  </env>',
    foldersXml,
    '</collection>'
  ]
    .filter((line) => line !== '')
    .join('\n')
}

const getElementChildren = (node: ParsedXmlNode | null | undefined, name?: string) => {
  if (!node) return [] as ParsedXmlNode[]

  const items: ParsedXmlNode[] = []
  let current = node.firstChild ?? null

  while (current) {
    if (current.nodeType === 1 && (!name || current.nodeName === name)) {
      items.push(current)
    }
    current = current.nextSibling ?? null
  }

  return items
}

const getAttr = (node: ParsedXmlNode | null | undefined, name: string) => {
  if (!node?.childNodes) return ''

  for (const child of node.childNodes) {
    if (child.nodeType === 2 && child.nodeName === name) {
      return child.nodeValue ?? ''
    }
  }

  return ''
}

const parseFields = (root: ParsedXmlNode | null | undefined, includeRequired: boolean): EditorField[] => {
  return getElementChildren(root, 'field')
    .map((fieldNode) => {
      const name = getAttr(fieldNode, 'name')
      const type = getAttr(fieldNode, 'type') || 'string'
      if (!name) return null

      const field: EditorField = { name, type }
      if (includeRequired) {
        field.required = getAttr(fieldNode, 'required') === 'true'
      }
      return field
    })
    .filter((field): field is EditorField => field !== null)
}

export const editorXmlNodeToData = (collectionNode: ParsedXmlNode): EditorData => {
  const envNode = getElementChildren(collectionNode, 'env')[0]
  const envVars = getElementChildren(envNode, 'var')
    .map((varNode) => {
      const name = getAttr(varNode, 'name')
      const value = getAttr(varNode, 'value')
      if (!name) return null
      return { name, value }
    })
    .filter((item): item is EditorVar => item !== null)

  const folderNodes = getElementChildren(collectionNode, 'group')
  const folders: EditorFolder[] = folderNodes.map((folderNode) => {
    const apiNodes = getElementChildren(folderNode, 'api')
    const apis: EditorApi[] = apiNodes.map((apiNode) => {
      const requestNode = getElementChildren(apiNode, 'request')[0]
      const requestBodyNode = getElementChildren(requestNode, 'body')[0]
      const responseNode = getElementChildren(apiNode, 'response')[0]
      const responseBodyNode = getElementChildren(responseNode, 'body')[0]

      return {
        name: getAttr(apiNode, 'name') || 'api',
        method: getAttr(apiNode, 'method') || 'GET',
        path: getAttr(apiNode, 'path') || '/',
        requestBody: parseFields(requestBodyNode, true),
        responseBody: parseFields(responseBodyNode, false)
      }
    })

    return {
      name: getAttr(folderNode, 'name') || 'default',
      apis
    }
  })

  return {
    env: {
      vars: envVars.length ? envVars : DEFAULT_ENV
    },
    folders
  }
}

export const editorXmlToData = (xmlContent: string): EditorData => {
  const parser = new XmlParser()
  const documentNode = parser.xmlParse(xmlContent) as ParsedXmlNode
  const collectionNode = documentNode.documentElement

  if (!collectionNode || collectionNode.nodeName !== 'collection') {
    throw new Error('Invalid editor XML: collection root is required')
  }

  return editorXmlNodeToData(collectionNode)
}
