/**
 * Script para generar archivos HTML desde los manuales Markdown
 * Ejecutar con: node generar-html.js
 */

const fs = require('fs');
const path = require('path');

// Función simple para convertir markdown básico a HTML
function markdownToHTML(markdown) {
    let html = markdown;

    // Headers
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 id="$1">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 id="$1">$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4 id="$1">$1</h4>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" />');

    // Code blocks
    html = html.replace(/```([^`]+)```/gs, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

    // Wrap consecutive list items
    html = html.replace(/(<li>.*<\/li>\n?)+/g, function(match) {
        return '<ul>' + match + '</ul>';
    });

    // Paragraphs (líneas que no son headers, lists, etc.)
    html = html.split('\n').map(line => {
        line = line.trim();
        if (line && !line.match(/^<[h|u|o|l|p|d|i]/) && !line.match(/^[#|*|\-|\d+\.]/)) {
            return '<p>' + line + '</p>';
        }
        return line;
    }).join('\n');

    // Tables
    html = html.replace(/\|(.*)\|/g, function(match) {
        const cells = match.split('|').filter(c => c.trim());
        if (cells.length > 0) {
            return '<tr>' + cells.map(c => '<td>' + c.trim() + '</td>').join('') + '</tr>';
        }
        return match;
    });

    // Horizontal rule
    html = html.replace(/^---$/gim, '<hr>');

    // Clean up
    html = html.replace(/\n{3,}/g, '\n\n');

    return html;
}

// Plantilla HTML
const htmlTemplate = (title, content, isAdmin = true) => `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Stella Maris Manager</title>
    <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'PT Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
        }

        .header {
            text-align: center;
            margin-bottom: 50px;
            padding-bottom: 30px;
            border-bottom: 4px solid #64B5F6;
        }

        .header h1 {
            color: #64B5F6;
            font-size: 2.8em;
            margin-bottom: 15px;
            font-weight: 700;
        }

        .header .subtitle {
            color: #666;
            font-size: 1.2em;
            margin-bottom: 10px;
        }

        .header .meta {
            color: #999;
            font-size: 0.95em;
            margin-top: 15px;
        }

        .toc {
            background: #f9f9f9;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 30px;
            margin: 40px 0;
        }

        .toc h2 {
            color: #64B5F6;
            margin-bottom: 20px;
            font-size: 1.8em;
        }

        .toc ul {
            list-style: none;
        }

        .toc li {
            margin: 10px 0;
        }

        .toc a {
            color: #555;
            text-decoration: none;
            font-size: 1.05em;
            transition: color 0.3s;
        }

        .toc a:hover {
            color: #64B5F6;
            text-decoration: underline;
        }

        .toc ul ul {
            margin-left: 30px;
            margin-top: 5px;
        }

        .content h1 {
            color: #64B5F6;
            font-size: 2.2em;
            margin-top: 50px;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #e0e0e0;
            page-break-after: avoid;
        }

        .content h2 {
            color: #64B5F6;
            font-size: 1.8em;
            margin-top: 40px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
            page-break-after: avoid;
        }

        .content h3 {
            color: #FFAB40;
            font-size: 1.5em;
            margin-top: 30px;
            margin-bottom: 15px;
            page-break-after: avoid;
        }

        .content h4 {
            color: #555;
            font-size: 1.2em;
            margin-top: 25px;
            margin-bottom: 12px;
        }

        .content p {
            margin-bottom: 18px;
            text-align: justify;
            font-size: 1.05em;
        }

        .content ul, .content ol {
            margin-left: 40px;
            margin-bottom: 20px;
            font-size: 1.05em;
        }

        .content li {
            margin-bottom: 10px;
        }

        .content table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .content table th,
        .content table td {
            border: 1px solid #ddd;
            padding: 15px;
            text-align: left;
        }

        .content table th {
            background: #64B5F6;
            color: white;
            font-weight: 700;
            font-size: 1.1em;
        }

        .content table tr:nth-child(even) {
            background: #f9f9f9;
        }

        .content table tr:hover {
            background: #f0f7ff;
        }

        .content blockquote {
            border-left: 5px solid #FFAB40;
            padding: 20px 25px;
            margin: 25px 0;
            background: #fff3e0;
            border-radius: 4px;
            font-style: italic;
        }

        .content code {
            background: #f4f4f4;
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.95em;
            color: #e83e8c;
        }

        .content pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 25px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }

        .content pre code {
            background: none;
            padding: 0;
            color: inherit;
        }

        .content img {
            max-width: 100%;
            height: auto;
            border: 3px solid #e0e0e0;
            border-radius: 10px;
            margin: 30px auto;
            display: block;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            page-break-inside: avoid;
        }

        .content hr {
            border: none;
            border-top: 3px solid #64B5F6;
            margin: 40px 0;
        }

        .content strong {
            color: #555;
            font-weight: 700;
        }

        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 5px;
            font-size: 0.85em;
            font-weight: bold;
            margin-left: 8px;
        }

        .badge-required {
            background: #ff5252;
            color: white;
        }

        .note, .warning, .success {
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
            border-left: 5px solid;
        }

        .note {
            background: #e3f2fd;
            border-color: #64B5F6;
        }

        .warning {
            background: #fff3e0;
            border-color: #FFAB40;
        }

        .success {
            background: #e8f5e9;
            border-color: #66bb6a;
        }

        .print-buttons {
            position: fixed;
            bottom: 30px;
            right: 30px;
            display: flex;
            gap: 15px;
            z-index: 1000;
        }

        .btn {
            padding: 15px 30px;
            background: #64B5F6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 700;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.3s;
        }

        .btn:hover {
            background: #42a5f5;
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }

        .btn-secondary {
            background: #FFAB40;
        }

        .btn-secondary:hover {
            background: #ff9800;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .container {
                max-width: 100%;
                padding: 20px;
                box-shadow: none;
                border-radius: 0;
            }

            .print-buttons {
                display: none;
            }

            .content h1, .content h2 {
                page-break-after: avoid;
            }

            .content img {
                page-break-inside: avoid;
                max-width: 100%;
            }

            .content table {
                page-break-inside: avoid;
            }

            .content pre {
                page-break-inside: avoid;
            }

            @page {
                margin: 2cm;
            }

            a[href^="http"]:after {
                content: " (" attr(href) ")";
                font-size: 0.85em;
                color: #666;
            }

            a[href^="#"]:after {
                content: "";
            }
        }

        @media (max-width: 768px) {
            body {
                padding: 10px;
            }

            .container {
                padding: 20px;
            }

            .content {
                font-size: 0.95em;
            }

            .header h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <div class="subtitle">Stella Maris Manager</div>
            <div class="meta">
                Versión 1.0 | Diciembre 2025
            </div>
        </div>

        <div class="content">
            ${content}
        </div>
    </div>

    <div class="print-buttons">
        <button class="btn btn-secondary" onclick="window.print()">🖨️ Imprimir</button>
        <button class="btn" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">↑ Inicio</button>
    </div>
</body>
</html>`;

// Función mejorada para convertir markdown a HTML
function convertMarkdownToHTML(markdown) {
    let html = markdown;

    // Normalizar IDs para encabezados
    const headers = [];
    html = html.replace(/^(#{1,4})\s+(.+)$/gm, (match, hashes, text) => {
        const level = hashes.length;
        const id = text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        headers.push({ level, text, id });
        return `<h${level} id="${id}">${text}</h${level}>`;
    });

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic  
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Images - PROCESAR PRIMERO para evitar conflicto con links
    html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, (match, alt, src) => {
        // Asegurar que las imágenes usen rutas relativas
        let imageSrc = src;
        if (!imageSrc.startsWith('http') && !imageSrc.startsWith('data:') && !imageSrc.startsWith('/')) {
            // Si la ruta ya incluye 'imagenes/', mantenerla, si no, agregarla
            if (!imageSrc.includes('imagenes/')) {
                imageSrc = 'imagenes/' + imageSrc;
            }
        }
        return `<img src="${imageSrc}" alt="${alt || ''}" />`;
    });

    // Links - PROCESAR DESPUÉS de imágenes
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
        // Saltar si ya es parte de una imagen (no debería pasar, pero por si acaso)
        if (match.startsWith('!')) {
            return match;
        }
        if (url.startsWith('#')) {
            return `<a href="${url}">${text}</a>`;
        }
        return `<a href="${url}" target="_blank">${text}</a>`;
    });

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code>${code.trim()}</code></pre>`;
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Lists - procesar correctamente
    const lines = html.split('\n');
    let inList = false;
    let listType = '';
    let result = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const listMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
        const numMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);

        if (listMatch || numMatch) {
            const match = listMatch || numMatch;
            const indent = match[1].length;
            const content = match[3] || match[2];
            const type = numMatch ? 'ol' : 'ul';

            if (!inList || listType !== type) {
                if (inList) result.push(`</${listType}>`);
                result.push(`<${type}>`);
                inList = true;
                listType = type;
            }
            result.push(`  <li>${content}</li>`);
        } else {
            if (inList) {
                result.push(`</${listType}>`);
                inList = false;
            }
            
            if (line.trim() && !line.match(/^<[h|p|d|i|t|h|b|u|o|l|s]/)) {
                result.push(`<p>${line.trim()}</p>`);
            } else if (line.trim()) {
                result.push(line);
            } else {
                result.push('');
            }
        }
    }
    if (inList) result.push(`</${listType}>`);

    html = result.join('\n');

    // Tables
    html = html.replace(/\|(.+)\|/g, (match, row) => {
        const cells = row.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length === 0) return match;
        return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
    });

    // Wrap tables
    html = html.replace(/(<tr>[\s\S]*?<\/tr>\s*)+/g, (match) => {
        if (match.includes('<td>')) {
            return `<table>${match}</table>`;
        }
        return match;
    });

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');

    // Clean up multiple empty lines
    html = html.replace(/\n{3,}/g, '\n\n');

    // Process special blocks (note, warning, etc.)
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    return html;
}

// Leer y convertir manuales
const manuals = [
    { file: 'manual-administrador.md', title: 'Manual de Administrador', output: 'manual-administrador.html' },
    { file: 'manual-usuario-empleado.md', title: 'Manual de Usuario para Empleados', output: 'manual-empleado.html' }
];

const dir = __dirname;

manuals.forEach(({ file, title, output }) => {
    const filePath = path.join(dir, file);
    const outputPath = path.join(dir, output);

    try {
        if (fs.existsSync(filePath)) {
            const markdown = fs.readFileSync(filePath, 'utf-8');
            const htmlContent = convertMarkdownToHTML(markdown);
            const fullHTML = htmlTemplate(title, htmlContent);
            
            fs.writeFileSync(outputPath, fullHTML, 'utf-8');
            console.log(`✅ Generado: ${output}`);
        } else {
            console.log(`❌ No se encontró: ${file}`);
        }
    } catch (error) {
        console.error(`❌ Error procesando ${file}:`, error.message);
    }
});

console.log('\n📄 Archivos HTML generados exitosamente!');
console.log('Abre los archivos .html en tu navegador para visualizarlos.');

