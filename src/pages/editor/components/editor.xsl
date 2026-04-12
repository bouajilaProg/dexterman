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
    <select class="bg-[#1f2335] text-[#7aa2f7] font-black text-[10px] border-none focus:outline-none px-3 py-2 cursor-pointer appearance-none" data-editor-api-method="">
      <xsl:call-template name="method-option"><xsl:with-param name="method" select="'GET'"/><xsl:with-param name="current" select="$current"/></xsl:call-template>
      <xsl:call-template name="method-option"><xsl:with-param name="method" select="'POST'"/><xsl:with-param name="current" select="$current"/></xsl:call-template>
      <xsl:call-template name="method-option"><xsl:with-param name="method" select="'PUT'"/><xsl:with-param name="current" select="$current"/></xsl:call-template>
      <xsl:call-template name="method-option"><xsl:with-param name="method" select="'DELETE'"/><xsl:with-param name="current" select="$current"/></xsl:call-template>
    </select>
  </xsl:template>

  <xsl:template name="type-select">
    <xsl:param name="current" select="'string'"/>
    <select class="bg-transparent outline-none text-[#565f89] cursor-pointer appearance-none">
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
  </xsl:template>

  <xsl:template name="required-badge">
    <span data-action="toggle-req" data-handler="toggle">
      <xsl:attribute name="class">
        <xsl:choose>
          <xsl:when test="@required = 'true'">px-2 py-0.5 rounded text-[10px] font-black bg-[#7aa2f7]/20 text-[#7aa2f7] cursor-pointer</xsl:when>
          <xsl:otherwise>px-2 py-0.5 rounded text-[10px] font-black bg-[#292e42] text-[#565f89] cursor-pointer</xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <xsl:choose>
        <xsl:when test="@required = 'true'">YES</xsl:when>
        <xsl:otherwise>NO</xsl:otherwise>
      </xsl:choose>
    </span>
  </xsl:template>

  <xsl:template name="row-actions">
    <xsl:param name="accent" select="'#7aa2f7'"/>
    <div class="flex items-center justify-center gap-1">
      <button data-handler="move-up">
        <xsl:attribute name="class">text-[#565f89] hover:text-[<xsl:value-of select="$accent"/>] transition-colors</xsl:attribute>
        <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
      </button>
      <button data-handler="move-down">
        <xsl:attribute name="class">text-[#565f89] hover:text-[<xsl:value-of select="$accent"/>] transition-colors</xsl:attribute>
        <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
      </button>
      <button class="text-[#565f89] hover:text-[#f7768e] transition-colors" data-action="delete" data-handler="delete">
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
        <tr class="border-t border-[#292e42]" draggable="true">
          <td class="p-2 w-1/2"><input type="text" value="" placeholder="field_name" class="bg-transparent w-full focus:text-[#7aa2f7] outline-none" /></td>
          <td class="p-2 w-1/4">
            <select class="bg-transparent outline-none text-[#565f89] cursor-pointer appearance-none">
              <option>string</option><option>number</option><option>object</option>
            </select>
          </td>
          <td class="p-2 w-20 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-black bg-[#292e42] text-[#565f89] cursor-pointer" data-action="toggle-req" data-handler="toggle">NO</span></td>
          <td class="p-2 w-10 text-center">
            <div class="flex items-center justify-center gap-1">
              <button class="text-[#565f89] hover:text-[#7aa2f7] transition-colors" data-handler="move-up"><i data-lucide="chevron-up" class="w-3.5 h-3.5"></i></button>
              <button class="text-[#565f89] hover:text-[#7aa2f7] transition-colors" data-handler="move-down"><i data-lucide="chevron-down" class="w-3.5 h-3.5"></i></button>
              <button class="text-[#565f89] hover:text-[#f7768e] transition-colors" data-action="delete" data-handler="delete"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
          </td>
        </tr>
      </template>

      <template id="tpl-res-row">
        <tr class="border-b border-[#292e42] last:border-0" draggable="true">
          <td class="p-2 w-1/2"><input type="text" value="" placeholder="field_name" class="bg-transparent w-full text-[#9ece6a] outline-none" /></td>
          <td class="p-2 w-1/4">
            <select class="bg-transparent outline-none text-[#565f89] cursor-pointer appearance-none">
              <option>string</option><option>number</option><option>object</option>
            </select>
          </td>
          <td class="p-2 w-10 text-center">
            <div class="flex items-center justify-center gap-1">
              <button class="text-[#565f89] hover:text-[#9ece6a] transition-colors" data-handler="move-up"><i data-lucide="chevron-up" class="w-3.5 h-3.5"></i></button>
              <button class="text-[#565f89] hover:text-[#9ece6a] transition-colors" data-handler="move-down"><i data-lucide="chevron-down" class="w-3.5 h-3.5"></i></button>
              <button class="text-[#565f89] hover:text-[#f7768e] transition-colors" data-action="delete" data-handler="delete"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
          </td>
        </tr>
      </template>

      <main class="flex-1 flex flex-col bg-[#1a1b26]">
        <xsl:choose>
          <xsl:when test="$notFound">
            <div class="p-4 border-b border-[#292e42] flex gap-2 items-center bg-[#1a1b26]">
              <h2 class="text-sm font-bold text-[#f7768e]">API Not Found</h2>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
              <div class="border border-[#292e42] rounded-lg bg-[#16161e] p-6">
                <p class="text-sm text-[#a9b1d6]"><xsl:value-of select="/collection/ui/@message"/></p>
              </div>
            </div>
          </xsl:when>
          <xsl:otherwise>
            <div class="p-4 border-b border-[#292e42] flex gap-2 items-center bg-[#1a1b26]">
              <input class="w-48 text-xs bg-[#1f2335] text-[#c0caf5] border border-[#292e42] rounded px-3 py-2" data-editor-api-name="" value="{$api/@name}" placeholder="API name" />
              <div class="flex flex-1 border border-[#3b4261] rounded overflow-hidden">
                <xsl:call-template name="method-select">
                  <xsl:with-param name="current" select="$api/@method"/>
                </xsl:call-template>
                <input class="flex-1 mono text-xs bg-[#1a1b26] text-[#c0caf5] focus:outline-none border-none px-3" data-editor-api-path="" value="{$api/@path}" />
              </div>
              <button class="bg-[#7aa2f7] text-[#1a1b26] text-xs px-6 py-2 rounded font-bold hover:bg-[#7aa2f7]/80 transition-colors opacity-40 cursor-not-allowed" data-save-button="">SAVE</button>
            </div>

            <div class="flex-1 overflow-y-auto p-6 space-y-8">
              <section class="group/req">
                <div class="flex justify-between items-end mb-3">
                  <h3 class="text-[10px] font-bold text-[#565f89] uppercase tracking-widest">Request Body</h3>
                  <button class="text-[#7aa2f7] text-xs font-bold hover:text-[#7aa2f7]/80 transition-colors" data-add="request" data-handler="add" data-target="req-body" data-tpl="tpl-req-row">+ ADD FIELD</button>
                </div>
                <div class="border border-[#292e42] rounded-lg overflow-hidden bg-[#16161e]">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-[#1f2335] text-[#565f89]">
                      <tr>
                        <th class="w-1/2 p-2 font-normal">FIELD NAME</th>
                        <th class="w-1/4 p-2 font-normal">TYPE</th>
                        <th class="w-20 p-2 font-normal text-center">REQ</th>
                        <th class="w-10 p-2"></th>
                      </tr>
                    </thead>
                    <tbody id="req-body" class="mono" data-empty-colspan="4" data-empty-message="No item here.">
                      <xsl:for-each select="$api/request/body/field">
                        <tr class="border-t border-[#292e42]" draggable="true">
                          <td class="p-2"><input type="text" value="{@name}" class="bg-transparent w-full focus:text-[#7aa2f7] outline-none" /></td>
                          <td class="p-2">
                            <xsl:call-template name="type-select">
                              <xsl:with-param name="current" select="@type"/>
                            </xsl:call-template>
                          </td>
                          <td class="p-2 text-center">
                            <xsl:call-template name="required-badge"/>
                          </td>
                          <td class="p-2 text-center">
                            <xsl:call-template name="row-actions">
                              <xsl:with-param name="accent" select="'#7aa2f7'"/>
                            </xsl:call-template>
                          </td>
                        </tr>
                      </xsl:for-each>
                    </tbody>
                  </table>
                </div>
              </section>

              <section class="group/res">
                <div class="flex justify-between items-end mb-3">
                  <h3 class="text-[10px] font-bold text-[#9ece6a] uppercase tracking-widest">Response Output</h3>
                  <button class="text-[#9ece6a] text-xs font-bold hover:text-[#9ece6a]/80 transition-colors" data-add="response" data-handler="add" data-target="res-body" data-tpl="tpl-res-row">+ ADD FIELD</button>
                </div>
                <div class="border border-[#292e42] rounded-lg overflow-hidden bg-[#16161e]">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-[#1f2335] text-[#565f89]">
                      <tr>
                        <th class="w-1/2 p-2 font-normal">FIELD NAME</th>
                        <th class="w-1/4 p-2 font-normal">TYPE</th>
                        <th class="w-10 p-2"></th>
                      </tr>
                    </thead>
                    <tbody id="res-body" class="mono" data-empty-colspan="3" data-empty-message="No item here.">
                      <xsl:for-each select="$api/response/body/field">
                        <tr class="border-b border-[#292e42] last:border-0" draggable="true">
                          <td class="p-2 w-1/2"><input type="text" value="{@name}" class="bg-transparent w-full text-[#9ece6a] outline-none" /></td>
                          <td class="p-2 w-1/4">
                            <xsl:call-template name="type-select">
                              <xsl:with-param name="current" select="@type"/>
                            </xsl:call-template>
                          </td>
                          <td class="p-2 w-10 text-center">
                            <xsl:call-template name="row-actions">
                              <xsl:with-param name="accent" select="'#9ece6a'"/>
                            </xsl:call-template>
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
