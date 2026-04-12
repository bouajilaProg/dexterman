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
  selected?: boolean
}

export type EditorFolder = {
  name: string
  apis?: EditorApi[]
  selected?: boolean
}

export type EditorUiState = {
  notFound?: boolean
  message?: string
  selectedScope?: 'root' | 'folder'
  selectedFolder?: string
  selectedApi?: string
}

export type EditorVar = {
  name: string
  value: string
}

export type EditorData = {
  env?: {
    vars?: EditorVar[]
  }
  apis?: EditorApi[]
  folders?: EditorFolder[]
  ui?: EditorUiState
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

/**
 * @title conditionalAttr
 * @description Returns optional XML attribute snippet when a value exists.
 */
const conditionalAttr = (name: string, value?: string) => {
  if (!value) return ''
  return ` ${attr(name, value)}`
}

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
  /**
   * @title apiXml:selectedAttr
   * @description Builds optional XML attributes for UI-only selected state.
   */
  const selectedAttr = api.selected ? ` ${attr('selected', 'true')}` : ''
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
    `    <api ${attr('name', name)} ${attr('method', method)} ${attr('path', path)}${selectedAttr}>`,
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
  /**
   * @title folderXml:selectedAttr
   * @description Builds optional XML attributes for UI-only selected state.
   */
  const selectedAttr = folder.selected ? ` ${attr('selected', 'true')}` : ''
  const name = safeText(folder.name, 'default')
  const apis = folder.apis ?? []
  const renderedApis = apis.map((api) => apiXml(api)).join('\n')

  return [
    `  <group ${attr('name', name)}${selectedAttr}>`,
    renderedApis,
    '  </group>'
  ]
    .filter((line) => line !== '')
    .join('\n')
}

/**
 * @title rootApiXml
 * @description Renders collection-level APIs that are not inside folders.
 */
const rootApiXml = (api: EditorApi) => {
  const selectedAttr = api.selected ? ` ${attr('selected', 'true')}` : ''
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
    `  <api ${attr('name', name)} ${attr('method', method)} ${attr('path', path)}${selectedAttr}>`,
    '    <request>',
    '      <body>',
    requestBody,
    '      </body>',
    '    </request>',
    '    <response>',
    '      <body>',
    responseBody,
    '      </body>',
    '    </response>',
    '  </api>'
  ]
    .filter((line) => line !== '')
    .join('\n')
}

/**
 * @title uiXml
 * @description Renders transient UI metadata used only for server-side rendering.
 */
const uiXml = (ui?: EditorUiState) => {
  if (!ui) return ''

  const selectedScope = ui.selectedScope === 'root' || ui.selectedScope === 'folder'
    ? ui.selectedScope
    : undefined

  const selectedFolder = safeText(ui.selectedFolder)
  const selectedApi = safeText(ui.selectedApi)
  const message = safeText(ui.message)
  const notFound = ui.notFound ? 'true' : undefined

  const attrs = [
    conditionalAttr('not-found', notFound),
    conditionalAttr('selected-scope', selectedScope),
    conditionalAttr('selected-folder', selectedFolder),
    conditionalAttr('selected-api', selectedApi),
    conditionalAttr('message', message)
  ].join('')

  return `  <ui${attrs} />`
}

export const editorDataToXml = (data: EditorData) => {
  const envVars = data.env?.vars?.length ? data.env.vars : DEFAULT_ENV
  const rootApis = data.apis ?? []
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

  const rootApisXml = rootApis
    .map((api) => rootApiXml(api))
    .filter(Boolean)
    .join('\n')

  const uiBlock = uiXml(data.ui)

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<collection>',
    '  <env>',
    envXml,
    '  </env>',
    uiBlock,
    rootApisXml,
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

/**
 * @title parseApiNode
 * @description Parses one API node from XML into the editor data shape.
 */
const parseApiNode = (apiNode: ParsedXmlNode): EditorApi => {
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

  const rootApiNodes = getElementChildren(collectionNode, 'api')
  const apis: EditorApi[] = rootApiNodes.map(parseApiNode)

  const folderNodes = getElementChildren(collectionNode, 'group')
  const folders: EditorFolder[] = folderNodes.map((folderNode) => {
    const apiNodes = getElementChildren(folderNode, 'api')
    const folderApis: EditorApi[] = apiNodes.map(parseApiNode)

    return {
      name: getAttr(folderNode, 'name') || 'default',
      apis: folderApis
    }
  })

  return {
    env: {
      vars: envVars.length ? envVars : DEFAULT_ENV
    },
    apis,
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
