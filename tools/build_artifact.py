# index.html と css/js を1ファイルにまとめる (アーティファクト公開用)
import re, sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
css = open(os.path.join(root, 'css/style.css'), encoding='utf-8').read()
scripts = re.findall(r'<script src="(js/[^"]+)"></script>', html)
js = '\n'.join(open(os.path.join(root, s), encoding='utf-8').read() for s in scripts)
body = re.search(r'<body>(.*?)<script', html, re.S).group(1)
out = f'''<title>星晶のクロニクル</title>
<meta name="theme-color" content="#0b0a16">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet">
<style>
:root {{ color-scheme: dark; }}
{css}
</style>
{body}
<script>
{js}
</script>
'''
open(sys.argv[1], 'w', encoding='utf-8').write(out)
print('bytes', len(out.encode()))
