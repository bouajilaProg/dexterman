<?xml version="1.0" encoding="UTF-8"?>
<!-- @title pages/editor/components/sidebar.xsl -->
<!-- @descrption XSLT template that renders the collections sidebar and API tree from collection XML. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" omit-xml-declaration="yes"/>

  <xsl:template match="/">
    <xsl:variable name="selectedApi" select="/collection/group[1]/api[1]"/>
    <xsl:variable name="selectedGroup" select="/collection/group[1]"/>

    <aside class="h-full w-72 bg-[#16161e] border-r border-[#292e42] flex flex-col">
      <div class="h-12 flex items-center justify-between px-4 border-b border-[#292e42]">
        <div>
          <p class="text-[10px] font-bold text-[#565f89] uppercase tracking-widest">Collections</p>
          <p class="text-[10px] text-[#565f89]">
            <xsl:value-of select="$selectedApi/@name"/>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button class="text-[#565f89] hover:text-[#7aa2f7] transition-colors text-[10px] font-bold" data-handler="new-folder">
            + FOLDER
          </button>
          <button class="text-[#565f89] hover:text-[#7aa2f7] transition-colors text-[10px] font-bold" data-handler="new-api">
            + API
          </button>
        </div>
      </div>

      <div class="p-2 space-y-2 overflow-y-auto">
        <xsl:for-each select="/collection/group">
          <details open="open" class="group" data-folder-dropzone="" data-folder-name="{@name}">
            <summary class="flex items-center p-2 text-xs font-bold text-[#565f89] uppercase cursor-pointer list-none rounded hover:bg-[#1f2335] transition-colors">
              <i data-lucide="chevron-down" class="w-3 h-3 mr-2 group-open:rotate-0 -rotate-90 transition-transform"></i>
              <xsl:value-of select="@name"/>
            </summary>

            <div class="ml-4 mt-1 p-1 space-y-1 min-h-[2rem]" data-folder-list="">
              <xsl:if test="generate-id(.) = generate-id($selectedGroup)">
                <button class="w-full p-2 text-[10px] uppercase font-bold text-[#565f89] border border-dashed border-[#292e42] rounded hover:text-[#7aa2f7] hover:border-[#7aa2f7] transition-colors" data-handler="new-api">
                  + NEW API
                </button>
              </xsl:if>
              <xsl:for-each select="api">
                <div data-api-item="" data-api-name="{@name}" draggable="true">
                  <xsl:attribute name="class">
                    <xsl:choose>
                      <xsl:when test="generate-id(.) = generate-id($selectedApi)">
                        p-2 text-xs bg-[#7aa2f7]/10 border-l-2 border-[#7aa2f7] flex items-center rounded cursor-move
                      </xsl:when>
                      <xsl:otherwise>
                        p-2 text-xs bg-[#1a1b26] border-l-2 border-[#9ece6a] flex items-center rounded cursor-move
                      </xsl:otherwise>
                    </xsl:choose>
                  </xsl:attribute>

                  <span class="text-[9px] font-black mr-2">
                    <xsl:attribute name="class">
                      <xsl:text>text-[9px] font-black mr-2 </xsl:text>
                      <xsl:choose>
                        <xsl:when test="@method = 'GET'">text-[#7dcfff]</xsl:when>
                        <xsl:when test="@method = 'POST'">text-[#7aa2f7]</xsl:when>
                        <xsl:when test="@method = 'PUT'">text-[#e0af68]</xsl:when>
                        <xsl:otherwise>text-[#f7768e]</xsl:otherwise>
                      </xsl:choose>
                    </xsl:attribute>
                    <xsl:value-of select="@method"/>
                  </span>

                  <span><xsl:value-of select="@name"/></span>
                  <span class="ml-auto text-[#565f89] truncate max-w-[80px]">
                    <xsl:value-of select="@path"/>
                  </span>
                  <i data-lucide="chevron-down" class="w-3 h-3 ml-2 text-[#565f89]"></i>
                </div>
              </xsl:for-each>
            </div>
          </details>
        </xsl:for-each>
      </div>
      <div class="border-t border-[#292e42] p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-bold text-[#565f89] uppercase tracking-widest">Environment</span>
          <button class="text-[#565f89] hover:text-[#7aa2f7] transition-colors text-[10px] font-bold" data-handler="env-page">
            OPEN
          </button>
        </div>
        <div class="text-[11px] text-[#565f89]">Environment editor coming soon.</div>
      </div>
    </aside>
  </xsl:template>
</xsl:stylesheet>
