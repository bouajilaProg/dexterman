<?xml version="1.0" encoding="UTF-8"?>
<!-- @title pages/docs/components/docs.xsl -->
<!-- @descrption XSLT template that renders all APIs into expandable docs cards. -->
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" omit-xml-declaration="yes"/>

    <xsl:template name="request-fields">
        <xsl:param name="nodes"/>
        <xsl:choose>
            <xsl:when test="count($nodes) &gt; 0">
                <ul class="space-y-2 text-[11px]">
                    <xsl:for-each select="$nodes">
                        <li class="border border-border-subtle bg-bg-base px-2 py-2 space-y-1">
                            <div class="flex items-center justify-between gap-2">
                                <span class="font-medium text-text-normal">
                                    <xsl:value-of select="@name"/>
                                </span>
                                <span class="text-text-dim">
                                    <xsl:value-of select="@type"/>
                                    <xsl:text></xsl:text>
                                    <xsl:choose>
                                        <xsl:when test="@required = 'true'">(required)</xsl:when>
                                        <xsl:otherwise>(optional)</xsl:otherwise>
                                    </xsl:choose>
                                </span>
                            </div>
                            <input class="w-full border border-border-subtle bg-bg-panel px-2 py-1.5 text-xs text-text-normal outline-none focus:border-border-strong" data-request-field="">
                                <xsl:attribute name="data-field-name">
                                    <xsl:value-of select="@name"/>
                                </xsl:attribute>
                                <xsl:attribute name="data-field-type">
                                    <xsl:value-of select="@type"/>
                                </xsl:attribute>
                                <xsl:attribute name="data-required">
                                    <xsl:choose>
                                        <xsl:when test="@required = 'true'">true</xsl:when>
                                        <xsl:otherwise>false</xsl:otherwise>
                                    </xsl:choose>
                                </xsl:attribute>
                                <xsl:attribute name="placeholder">
                                    <xsl:text>Enter </xsl:text>
                                    <xsl:value-of select="@name"/>
                                </xsl:attribute>
                            </input>
                        </li>
                    </xsl:for-each>
                </ul>
            </xsl:when>
            <xsl:otherwise>
                <p class="text-[11px] text-text-dim border border-dashed border-border-subtle px-2 py-2">No fields defined.</p>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template name="response-fields">
        <xsl:param name="nodes"/>
        <xsl:choose>
            <xsl:when test="count($nodes) &gt; 0">
                <ul class="space-y-1 text-[11px]">
                    <xsl:for-each select="$nodes">
                        <li class="flex items-center justify-between border border-border-subtle bg-bg-base px-2 py-1">
                            <span class="font-medium text-text-normal">
                                <xsl:value-of select="@name"/>
                            </span>
                            <span class="text-text-dim">
                                <xsl:value-of select="@type"/>
                            </span>
                        </li>
                    </xsl:for-each>
                </ul>
            </xsl:when>
            <xsl:otherwise>
                <p class="text-[11px] text-text-dim border border-dashed border-border-subtle px-2 py-2">No fields defined.</p>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="api">
        <xsl:param name="group"/>
        <xsl:variable name="method" select="@method"/>

        <details class="border border-border-subtle bg-bg-panel open:border-border-strong">
            <summary class="py-3 px-4 cursor-pointer">
                <div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    <span>
                        <xsl:attribute name="class">
                            <xsl:text>inline-flex w-fit items-center rounded border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase </xsl:text>
                            <xsl:choose>
                                <xsl:when test="$method = 'GET'">text-accent-success border-accent-success/40 bg-accent-success/10</xsl:when>
                                <xsl:when test="$method = 'POST'">text-accent-primary border-accent-primary/40 bg-accent-primary/10</xsl:when>
                                <xsl:when test="$method = 'PUT'">text-accent-warning border-accent-warning/40 bg-accent-warning/10</xsl:when>
                                <xsl:when test="$method = 'PATCH'">text-text-bright border-border-strong bg-bg-elevated</xsl:when>
                                <xsl:otherwise>text-accent-danger border-accent-danger/40 bg-accent-danger/10</xsl:otherwise>
                            </xsl:choose>
                        </xsl:attribute>
                        <xsl:value-of select="@method"/>
                    </span>
                    <code class="text-[12px] text-text-bright break-all">
                        <xsl:value-of select="@path"/>
                    </code>
                    <span class="text-[11px] text-text-dim md:ml-auto">
                        <xsl:choose>
                            <xsl:when test="string-length($group) &gt; 0">
                                <xsl:text>Group: </xsl:text>
                                <xsl:value-of select="$group"/>
                            </xsl:when>
                            <xsl:otherwise>Root API</xsl:otherwise>
                        </xsl:choose>
                    </span>
                </div>
            </summary>

            <div class="px-4 pb-4 space-y-4">
                <div class="flex flex-col gap-1">
                    <h2 class="text-sm font-semibold text-text-bright">
                        <xsl:value-of select="@name"/>
                    </h2>
                    <p class="text-[11px] text-text-dim">Endpoint URL</p>
                    <input class="w-full border border-border-subtle bg-bg-base px-2 py-2 text-xs text-text-normal outline-none focus:border-border-strong" data-endpoint-url="">
                        <xsl:attribute name="value">
                            <xsl:value-of select="@path"/>
                        </xsl:attribute>
                    </input>
                </div>

                <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <section class="space-y-2">
                        <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim">Request Params</h3>
                        <xsl:call-template name="request-fields">
                            <xsl:with-param name="nodes" select="request/body/field"/>
                        </xsl:call-template>
                    </section>

                    <section class="space-y-2">
                        <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim">Response Fields</h3>
                        <xsl:call-template name="response-fields">
                            <xsl:with-param name="nodes" select="response/body/field"/>
                        </xsl:call-template>
                    </section>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                    <button data-execute="">
                        <xsl:attribute name="class">
                            <xsl:text>border px-3 py-1.5 text-xs font-semibold transition-colors </xsl:text>
                            <xsl:choose>
                                <xsl:when test="$method = 'GET'">border-accent-success/40 bg-accent-success/10 text-accent-success hover:bg-accent-success/20</xsl:when>
                                <xsl:when test="$method = 'POST'">border-accent-primary/40 bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20</xsl:when>
                                <xsl:when test="$method = 'PUT'">border-accent-warning/40 bg-accent-warning/10 text-accent-warning hover:bg-accent-warning/20</xsl:when>
                                <xsl:when test="$method = 'PATCH'">border-border-strong bg-bg-elevated text-text-bright hover:bg-bg-panel</xsl:when>
                                <xsl:otherwise>border-accent-danger/40 bg-accent-danger/10 text-accent-danger hover:bg-accent-danger/20</xsl:otherwise>
                            </xsl:choose>
                        </xsl:attribute>
                        <xsl:attribute name="data-method">
                            <xsl:value-of select="@method"/>
                        </xsl:attribute>
            Execute
                    </button>
                    <span class="text-[11px] text-text-dim" data-output-status="">Idle</span>
                </div>

                <section class="space-y-2">
                    <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim">Response Output</h3>
                    <pre class="max-h-72 overflow-auto border border-border-subtle bg-bg-base p-3 text-[11px] text-text-normal" data-output-json="">Run endpoint to see response.</pre>
                </section>
            </div>
        </details>
    </xsl:template>

    <xsl:template match="/">
        <div class="space-y-4">
            <xsl:if test="count(/collection/api) &gt; 0">
                <section class="space-y-3">
                    <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim">Root APIs</p>
                    <xsl:for-each select="/collection/api">
                        <xsl:apply-templates select="."/>
                    </xsl:for-each>
                </section>
            </xsl:if>

            <xsl:for-each select="/collection/group">
                <xsl:if test="position() &gt; 1 or count(/collection/api) &gt; 0">
                    <div class="border-t border-border-subtle"></div>
                </xsl:if>

                <section class="space-y-3">
                    <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim">
                        <xsl:text>Group: </xsl:text>
                        <xsl:value-of select="@name"/>
                    </p>
                    <xsl:variable name="groupName" select="@name"/>
                    <xsl:for-each select="api">
                        <xsl:apply-templates select=".">
                            <xsl:with-param name="group" select="$groupName"/>
                        </xsl:apply-templates>
                    </xsl:for-each>
                </section>
            </xsl:for-each>

            <xsl:if test="count(/collection/api) = 0 and count(/collection/group/api) = 0">
                <div class="border border-dashed border-border-subtle bg-bg-panel px-4 py-8 text-center">
                    <p class="text-sm text-text-dim">No API items found in the XML collection.</p>
                </div>
            </xsl:if>
        </div>
    </xsl:template>
</xsl:stylesheet>
