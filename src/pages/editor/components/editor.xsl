<?xml version="1.0" encoding="UTF-8"?>
<!-- @title pages/editor/components/editor.xsl -->
<!-- @descrption XSLT template that transforms collection XML into the main editable editor panel UI. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" omit-xml-declaration="yes"/>

  <xsl:template name="method-option">
    <xsl:param name="method"/>
    <xsl:param name="current"/>
    <option>
      <xsl:if test="$current = $method">
        <xsl:attribute name="selected">selected</xsl:attribute>
      </xsl:if>
      <xsl:value-of select="$method"/>
    </option>
  </xsl:template>

  <xsl:template name="method-select">
    <xsl:param name="current" select="'GET'"/>
    <select class="bg-bg-elevated text-accent-primary font-black text-[10px] border-none focus:outline-none px-3 py-2 cursor-pointer appearance-none" data-editor-api-method="" data-method-theme="method-select">
      <xsl:call-template name="method-option"><xsl:with-param name="method" select="'GET'"/><xsl:with-param name="current" select="$current"/></xsl:call-template>
      <xsl:call-template name="method-option"><xsl:with-param name="method" select="'POST'"/><xsl:with-param name="current" select="$current"/></xsl:call-template>
      <xsl:call-template name="method-option"><xsl:with-param name="method" select="'PUT'"/><xsl:with-param name="current" select="$current"/></xsl:call-template>
      <xsl:call-template name="method-option"><xsl:with-param name="method" select="'DELETE'"/><xsl:with-param name="current" select="$current"/></xsl:call-template>
    </select>
  </xsl:template>

  <xsl:template name="type-select">
    <xsl:param name="current" select="'string'"/>
    <div class="relative inline-block w-full">
      <select class="bg-transparent outline-none text-text-dim cursor-pointer appearance-none w-full pr-6 relative z-10">
        <option>
          <xsl:if test="$current = 'string'"><xsl:attribute name="selected">selected</xsl:attribute></xsl:if>
          string
        </option>
        <option>
          <xsl:if test="$current = 'number'"><xsl:attribute name="selected">selected</xsl:attribute></xsl:if>
          number
        </option>
        <option>
          <xsl:if test="$current = 'object'"><xsl:attribute name="selected">selected</xsl:attribute></xsl:if>
          object
        </option>
      </select>
      <i data-lucide="chevron-down" class="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none z-0"></i>
    </div>
  </xsl:template>

  <xsl:template name="required-badge">
    <span data-action="toggle-req" data-handler="toggle" data-method-theme="required-toggle">
      <xsl:attribute name="class">
        <xsl:choose>
          <xsl:when test="@required = 'true'">px-2 py-0.5 rounded text-[10px] font-black bg-accent-primary/20 text-accent-primary cursor-pointer</xsl:when>
          <xsl:otherwise>px-2 py-0.5 rounded text-[10px] font-black bg-bg-elevated text-text-dim cursor-pointer</xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <xsl:choose>
        <xsl:when test="@required = 'true'">YES</xsl:when>
        <xsl:otherwise>NO</xsl:otherwise>
      </xsl:choose>
    </span>
  </xsl:template>

  <xsl:template name="row-actions">
    <div class="flex items-center justify-end gap-1">
      <button class="text-text-dim transition-colors" data-handler="move-up" data-method-theme="row-action">
        <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
      </button>
      <button class="text-text-dim transition-colors" data-handler="move-down" data-method-theme="row-action">
        <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
      </button>
      <button class="text-text-dim hover:text-accent-danger transition-colors ml-1" data-action="delete" data-handler="delete">
        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  </xsl:template>

  <xsl:template match="/">
    <xsl:variable name="selectedApi" select="(/collection/api[@selected='true'] | /collection/group/api[@selected='true'])[1]"/>
    <xsl:variable name="api" select="($selectedApi | /collection/api[1] | /collection/group[1]/api[1])[1]"/>
    <xsl:variable name="notFound" select="/collection/ui/@not-found = 'true'"/>

    <div>
      <template id="tpl-req-row">
        <tr class="border-t border-border-subtle" draggable="true">
          <td class="py-1 px-2 w-1/2"><input type="text" value="" placeholder="field_name" class="bg-transparent w-full focus:text-accent-primary outline-none" data-method-theme="field-input" /></td>
          <td class="py-1 px-2 w-1/4">
            <div class="relative inline-block w-full">
              <select class="bg-transparent outline-none text-text-dim cursor-pointer appearance-none w-full pr-6 relative z-10">
                <option>string</option><option>number</option><option>object</option>
              </select>
              <i data-lucide="chevron-down" class="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none z-0"></i>
            </div>
          </td>
          <td class="py-1 px-2 w-20 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-black bg-bg-elevated text-text-dim cursor-pointer" data-action="toggle-req" data-handler="toggle" data-method-theme="required-toggle">NO</span></td>
          <td class="py-1 px-2 w-16 pr-4">
            <div class="flex items-center justify-end gap-1">
              <button class="text-text-dim transition-colors" data-handler="move-up" data-method-theme="row-action"><i data-lucide="chevron-up" class="w-3.5 h-3.5"></i></button>
              <button class="text-text-dim transition-colors" data-handler="move-down" data-method-theme="row-action"><i data-lucide="chevron-down" class="w-3.5 h-3.5"></i></button>
              <button class="text-text-dim hover:text-accent-danger transition-colors ml-1" data-action="delete" data-handler="delete"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
          </td>
        </tr>
      </template>

      <template id="tpl-res-row">
        <tr class="border-b border-border-subtle last:border-0" draggable="true">
          <td class="py-1 px-2 w-1/2"><input type="text" value="" placeholder="field_name" class="bg-transparent w-full focus:text-accent-primary outline-none" data-method-theme="field-input" /></td>
          <td class="py-1 px-2 w-1/4">
            <div class="relative inline-block w-full">
              <select class="bg-transparent outline-none text-text-dim cursor-pointer appearance-none w-full pr-6 relative z-10">
                <option>string</option><option>number</option><option>object</option>
              </select>
              <i data-lucide="chevron-down" class="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none z-0"></i>
            </div>
          </td>
          <td class="py-1 px-2 w-16 pr-4">
            <div class="flex items-center justify-end gap-1">
              <button class="text-text-dim transition-colors" data-handler="move-up" data-method-theme="row-action"><i data-lucide="chevron-up" class="w-3.5 h-3.5"></i></button>
              <button class="text-text-dim transition-colors" data-handler="move-down" data-method-theme="row-action"><i data-lucide="chevron-down" class="w-3.5 h-3.5"></i></button>
              <button class="text-text-dim hover:text-accent-danger transition-colors ml-1" data-action="delete" data-handler="delete"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
          </td>
        </tr>
      </template>

      <main class="flex-1 flex flex-col bg-bg-base text-xs">
        <xsl:choose>
          <xsl:when test="$notFound">
            <div class="p-4 border-b border-border-subtle flex gap-2 items-center bg-bg-base">
              <h2 class="text-sm font-bold text-accent-danger">API Not Found</h2>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
              <div class="border border-border-subtle rounded-lg bg-bg-panel p-6">
                <p class="text-sm text-text-dim"><xsl:value-of select="/collection/ui/@message"/></p>
              </div>
            </div>
          </xsl:when>
          <xsl:otherwise>
            <div class="p-4 border-b border-border-subtle flex gap-2 items-center bg-bg-base">
              <input class="w-48 text-xs bg-bg-elevated text-text-normal border border-border-subtle rounded px-3 py-2" data-editor-api-name="" value="{$api/@name}" placeholder="API name" />
              <div class="flex flex-1 border border-border-strong rounded overflow-hidden">
                <xsl:call-template name="method-select">
                  <xsl:with-param name="current" select="$api/@method"/>
                </xsl:call-template>
                <input class="flex-1 mono text-xs bg-bg-base text-text-normal focus:outline-none border-none px-3" data-editor-api-path="" value="{$api/@path}" />
              </div>
              <button class="bg-accent-primary text-bg-base text-xs px-6 py-2 rounded font-bold hover:bg-accent-primary/80 transition-colors opacity-40 cursor-not-allowed" data-save-button="" data-method-theme="save-button">SAVE</button>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-6">
              <section class="group/req">
                <div class="flex justify-between items-end mb-3">
                  <h3 class="text-[10px] font-bold text-accent-primary uppercase tracking-widest" data-method-theme="section-title">Request Body</h3>
                  <button class="text-accent-primary text-xs font-bold hover:text-accent-primary/80 transition-colors" data-add="request" data-handler="add" data-target="req-body" data-tpl="tpl-req-row" data-method-theme="section-action">+ ADD FIELD</button>
                </div>
                <div class="border-y border-border-subtle">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-bg-elevated text-text-dim">
                      <tr>
                        <th class="w-1/2 py-1 px-2 font-normal">FIELD NAME</th>
                        <th class="w-1/4 py-1 px-2 font-normal">TYPE</th>
                        <th class="w-20 py-1 px-2 font-normal text-center">REQ</th>
                        <th class="w-16 py-1 px-2 pr-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody id="req-body" class="mono" data-empty-colspan="4" data-empty-message="No item here.">
                      <xsl:for-each select="$api/request/body/field">
                        <tr class="border-t border-border-subtle" draggable="true">
                          <td class="py-1 px-2"><input type="text" value="{@name}" class="bg-transparent w-full focus:text-accent-primary outline-none" data-method-theme="field-input" /></td>
                          <td class="py-1 px-2">
                            <xsl:call-template name="type-select">
                              <xsl:with-param name="current" select="@type"/>
                            </xsl:call-template>
                          </td>
                          <td class="py-1 px-2 text-center">
                            <xsl:call-template name="required-badge"/>
                          </td>
                          <td class="py-1 px-2 w-16 pr-4">
                            <xsl:call-template name="row-actions"/>
                          </td>
                        </tr>
                      </xsl:for-each>
                    </tbody>
                  </table>
                </div>
              </section>

              <section class="group/res">
                <div class="flex justify-between items-end mb-3">
                  <h3 class="text-[10px] font-bold text-accent-primary uppercase tracking-widest" data-method-theme="section-title">Response Output</h3>
                  <button class="text-accent-primary text-xs font-bold hover:text-accent-primary/80 transition-colors" data-add="response" data-handler="add" data-target="res-body" data-tpl="tpl-res-row" data-method-theme="section-action">+ ADD FIELD</button>
                </div>
                <div class="border-y border-border-subtle">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-bg-elevated text-text-dim">
                      <tr>
                        <th class="w-1/2 py-1 px-2 font-normal">FIELD NAME</th>
                        <th class="w-1/4 py-1 px-2 font-normal">TYPE</th>
                        <th class="w-16 py-1 px-2 pr-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody id="res-body" class="mono" data-empty-colspan="3" data-empty-message="No item here.">
                      <xsl:for-each select="$api/response/body/field">
                        <tr class="border-b border-border-subtle last:border-0" draggable="true">
                          <td class="py-1 px-2 w-1/2"><input type="text" value="{@name}" class="bg-transparent w-full focus:text-accent-primary outline-none" data-method-theme="field-input" /></td>
                          <td class="py-1 px-2 w-1/4">
                            <xsl:call-template name="type-select">
                              <xsl:with-param name="current" select="@type"/>
                            </xsl:call-template>
                          </td>
                          <td class="py-1 px-2 w-16 pr-4">
                            <xsl:call-template name="row-actions"/>
                          </td>
                        </tr>
                      </xsl:for-each>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </xsl:otherwise>
        </xsl:choose>
      </main>
    </div>
  </xsl:template>
</xsl:stylesheet>
