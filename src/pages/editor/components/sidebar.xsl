<?xml version="1.0" encoding="UTF-8"?>
<!-- @title pages/editor/components/sidebar.xsl -->
<!-- @descrption XSLT template that renders root APIs and folder/API tree from collection XML. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" omit-xml-declaration="yes"/>

  <xsl:template match="/">
    <xsl:variable name="selectedRootApi" select="/collection/api[@selected='true'][1]"/>
    <xsl:variable name="selectedFolderApi" select="/collection/group/api[@selected='true'][1]"/>
    <xsl:variable name="selectedLabel">
      <xsl:choose>
        <xsl:when test="$selectedRootApi">
          <xsl:value-of select="$selectedRootApi/@name"/>
        </xsl:when>
        <xsl:when test="$selectedFolderApi">
          <xsl:value-of select="$selectedFolderApi/@name"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="/collection/api[1]/@name"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <aside class="h-full w-72 bg-[#16161e] border-r border-[#292e42] flex flex-col">
      <div class="h-12 flex items-center justify-between px-4 border-b border-[#292e42]">
        <div>
          <p class="text-[10px] font-bold text-[#565f89] uppercase tracking-widest">Collections</p>
          <p class="text-[10px] text-[#565f89]">
            <xsl:value-of select="$selectedLabel"/>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button class="text-[#565f89] hover:text-[#7aa2f7] transition-colors text-[10px] font-bold" data-handler="new-folder" title="New folder">
            + FOLDER
          </button>
          <button class="w-5 h-5 rounded border border-[#292e42] text-[#565f89] hover:text-[#7aa2f7] hover:border-[#7aa2f7] transition-colors flex items-center justify-center" data-handler="new-root-api" title="New root API">
            <i data-lucide="plus" class="w-3 h-3"></i>
          </button>
        </div>
      </div>

      <div class="p-2 space-y-2 overflow-y-auto">
        <xsl:if test="/collection/api">
          <details open="open" class="group" data-root-api-section="true">
            <summary class="flex items-center p-2 text-xs font-bold text-[#565f89] uppercase cursor-pointer list-none rounded hover:bg-[#1f2335] transition-colors">
              <i data-lucide="chevron-down" class="w-3 h-3 mr-2 group-open:rotate-0 -rotate-90 transition-transform"></i>
              Root APIs
            </summary>

            <div class="ml-4 mt-1 p-1 space-y-1 min-h-[2rem]">
              <xsl:for-each select="/collection/api">
                <div data-api-item="" data-api-name="{@name}" data-api-path="{@path}" draggable="false">
                  <xsl:if test="@selected='true'">
                    <xsl:attribute name="data-api-active">true</xsl:attribute>
                  </xsl:if>
                  <xsl:attribute name="class">
                    <xsl:choose>
                      <xsl:when test="@selected='true'">
                        p-2 text-xs bg-[#7aa2f7]/10 border-l-2 border-[#7aa2f7] flex items-center rounded
                      </xsl:when>
                      <xsl:otherwise>
                        p-2 text-xs bg-[#1a1b26] border-l-2 border-[#9ece6a] flex items-center rounded
                      </xsl:otherwise>
                    </xsl:choose>
                  </xsl:attribute>

                  <a class="min-w-0 flex flex-1 items-center" href="/?path={@name}" data-api-link="" data-api-selection-path="{@name}">
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

                    <span class="truncate"><xsl:value-of select="@name"/></span>
                    <span class="ml-auto text-[#565f89] truncate max-w-[80px]">
                      <xsl:value-of select="@path"/>
                    </span>
                  </a>
                  <button class="ml-2 text-[#565f89] hover:text-[#f7768e] transition-colors" data-handler="delete-root-api" data-api-name="{@name}" title="Delete API">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                  </button>
                </div>
              </xsl:for-each>
            </div>
          </details>
        </xsl:if>

        <xsl:for-each select="/collection/group">
          <details open="open" class="group" data-folder-dropzone="" data-folder-name="{@name}">
            <summary class="flex items-center p-2 text-xs font-bold text-[#565f89] uppercase cursor-pointer list-none rounded hover:bg-[#1f2335] transition-colors gap-2">
              <i data-lucide="chevron-down" class="w-3 h-3 group-open:rotate-0 -rotate-90 transition-transform"></i>
              <span class="truncate"><xsl:value-of select="@name"/></span>
              <span class="ml-auto flex items-center gap-1">
                <button class="w-5 h-5 rounded border border-[#292e42] text-[#565f89] hover:text-[#7aa2f7] hover:border-[#7aa2f7] transition-colors flex items-center justify-center" data-handler="new-api" data-folder-name="{@name}" title="New API">
                  <i data-lucide="plus" class="w-3 h-3"></i>
                </button>
                <button class="text-[#565f89] hover:text-[#7aa2f7] transition-colors" data-handler="rename-folder" data-folder-name="{@name}" title="Rename folder">
                  <i data-lucide="pencil" class="w-3 h-3"></i>
                </button>
                <button class="text-[#565f89] hover:text-[#f7768e] transition-colors" data-handler="delete-folder" data-folder-name="{@name}" title="Delete folder">
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
              </span>
            </summary>

            <div class="ml-4 mt-1 p-1 space-y-1 min-h-[2rem]" data-folder-list="">
              <xsl:for-each select="api">
                <div data-api-item="" data-api-name="{@name}" data-api-path="{@path}" draggable="true">
                  <xsl:if test="@selected='true'">
                    <xsl:attribute name="data-api-active">true</xsl:attribute>
                  </xsl:if>
                  <xsl:attribute name="class">
                    <xsl:choose>
                      <xsl:when test="@selected='true'">
                        p-2 text-xs bg-[#7aa2f7]/10 border-l-2 border-[#7aa2f7] flex items-center rounded cursor-move
                      </xsl:when>
                      <xsl:otherwise>
                        p-2 text-xs bg-[#1a1b26] border-l-2 border-[#9ece6a] flex items-center rounded cursor-move
                      </xsl:otherwise>
                    </xsl:choose>
                  </xsl:attribute>

                  <a class="min-w-0 flex flex-1 items-center" href="/?path={../@name}/{@name}" data-api-link="" data-api-selection-path="{../@name}/{@name}">
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

                    <span class="truncate"><xsl:value-of select="@name"/></span>
                    <span class="ml-auto text-[#565f89] truncate max-w-[80px]">
                      <xsl:value-of select="@path"/>
                    </span>
                  </a>
                  <button class="ml-2 text-[#565f89] hover:text-[#f7768e] transition-colors" data-handler="delete-api" data-folder-name="{../@name}" data-api-name="{@name}" title="Delete API">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                  </button>
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
