<?xml version="1.0" encoding="UTF-8"?>
<!-- @title pages/editor/components/sidebar.xsl -->
<!-- @descrption XSLT template that renders root APIs and folder/API tree from collection XML. -->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
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

    <aside class="h-full w-72 bg-bg-panel border-r border-border-subtle flex flex-col">
      <div class="h-10 flex items-center justify-between px-3 border-b border-border-subtle">
        <div>
          <p class="text-[10px] font-bold text-text-dim uppercase tracking-widest">Collections</p>
          <p class="text-[10px] text-text-dim">
            <xsl:value-of select="$selectedLabel"/>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button class="text-text-dim hover:text-accent-primary transition-colors" data-handler="new-folder" title="New folder">
            <i data-lucide="folder-plus" class="w-4 h-4"></i>
          </button>
          <button class="text-text-dim hover:text-accent-primary transition-colors" data-handler="new-root-api" title="New root API">
            <i data-lucide="plus" class="w-3 h-3"></i>
          </button>
        </div>
      </div>

      <div class="py-2 space-y-0.5 overflow-y-auto">
        <xsl:for-each select="/collection/api">
          <div data-api-item="" data-api-name="{@name}" data-api-path="{@path}" draggable="false">
            <xsl:if test="@selected='true'">
              <xsl:attribute name="data-api-active">true</xsl:attribute>
            </xsl:if>
            <xsl:attribute name="class">
              <xsl:choose>
                <xsl:when test="@selected='true'">
                  p-1 px-2 text-xs bg-bg-elevated flex items-center rounded
                </xsl:when>
                <xsl:otherwise>
                  p-1 px-2 text-xs bg-transparent bg-transparent flex items-center rounded
                </xsl:otherwise>
              </xsl:choose>
            </xsl:attribute>

            <a class="min-w-0 flex flex-1 items-center" href="/?path={@name}" data-api-link="" data-api-selection-path="{@name}">
              <span class="text-[9px] font-black mr-2">
                <xsl:attribute name="class">
                  <xsl:text>text-[9px] font-black mr-2 </xsl:text>
                  <xsl:choose>
                    <xsl:when test="@method = 'GET'">text-text-bright</xsl:when>
                    <xsl:when test="@method = 'POST'">text-accent-primary</xsl:when>
                    <xsl:when test="@method = 'PUT'">text-accent-warning</xsl:when>
                    <xsl:otherwise>text-accent-danger</xsl:otherwise>
                  </xsl:choose>
                </xsl:attribute>
                <xsl:value-of select="@method"/>
              </span>

              <span class="truncate">
                <xsl:value-of select="@name"/>
              </span>
              <span class="ml-auto text-text-dim truncate max-w-[80px]">
                <xsl:value-of select="@path"/>
              </span>
            </a>
            <button class="ml-2 text-text-dim hover:text-accent-danger transition-colors" data-handler="delete-root-api" data-api-name="{@name}" title="Delete API">
              <i data-lucide="trash-2" class="w-3 h-3"></i>
            </button>
          </div>
        </xsl:for-each>

        <xsl:for-each select="/collection/group">
          <details open="open" class="group" data-folder-dropzone="" data-folder-name="{@name}">
            <summary class="flex items-center p-1 px-2 text-xs font-bold text-text-dim uppercase cursor-pointer list-none rounded hover:bg-bg-elevated transition-colors gap-2">
              <i data-lucide="chevron-down" class="w-3 h-3 group-open:rotate-0 -rotate-90 transition-transform"></i>
              <span class="truncate">
                <xsl:value-of select="@name"/>
              </span>
              <span class="ml-auto flex items-center gap-1">
                <button class="text-text-dim hover:text-accent-primary transition-colors" data-handler="new-api" data-folder-name="{@name}" title="New API">
                  <i data-lucide="plus" class="w-3 h-3"></i>
                </button>
                <button class="text-text-dim hover:text-accent-primary transition-colors" data-handler="rename-folder" data-folder-name="{@name}" title="Rename folder">
                  <i data-lucide="pencil" class="w-3 h-3"></i>
                </button>
                <button class="text-text-dim hover:text-accent-danger transition-colors" data-handler="delete-folder" data-folder-name="{@name}" title="Delete folder">
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
              </span>
            </summary>

            <div class="ml-4 mt-0.5 space-y-0.5 min-h-[2rem]" data-folder-list="">
              <xsl:for-each select="api">
                <div data-api-item="" data-api-name="{@name}" data-api-path="{@path}" draggable="true">
                  <xsl:if test="@selected='true'">
                    <xsl:attribute name="data-api-active">true</xsl:attribute>
                  </xsl:if>
                  <xsl:attribute name="class">
                    <xsl:choose>
                      <xsl:when test="@selected='true'">
                        p-1 px-2 text-xs bg-bg-elevated flex items-center rounded cursor-move
                      </xsl:when>
                      <xsl:otherwise>
                        p-1 px-2 text-xs bg-transparent bg-transparent flex items-center rounded cursor-move
                      </xsl:otherwise>
                    </xsl:choose>
                  </xsl:attribute>

                  <a class="min-w-0 flex flex-1 items-center" href="/?path={../@name}/{@name}" data-api-link="" data-api-selection-path="{../@name}/{@name}">
                    <span class="text-[9px] font-black mr-2">
                      <xsl:attribute name="class">
                        <xsl:text>text-[9px] font-black mr-2 </xsl:text>
                        <xsl:choose>
                          <xsl:when test="@method = 'GET'">text-accent-success</xsl:when>
                          <xsl:when test="@method = 'POST'">text-accent-primary</xsl:when>
                          <xsl:when test="@method = 'PUT'">text-accent-warning</xsl:when>
                          <xsl:otherwise>text-accent-danger</xsl:otherwise>
                        </xsl:choose>
                      </xsl:attribute>
                      <xsl:value-of select="@method"/>
                    </span>

                    <span class="truncate">
                      <xsl:value-of select="@name"/>
                    </span>
                    <span class="ml-auto text-text-dim truncate max-w-[80px]">
                      <xsl:value-of select="@path"/>
                    </span>
                  </a>
                  <button class="ml-2 text-text-dim hover:text-accent-danger transition-colors" data-handler="delete-api" data-folder-name="{../@name}" data-api-name="{@name}" title="Delete API">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                  </button>
                </div>
              </xsl:for-each>
            </div>
          </details>
        </xsl:for-each>
      </div>
    </aside>
  </xsl:template>
</xsl:stylesheet>
