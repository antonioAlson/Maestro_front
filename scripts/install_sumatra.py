"""
Script auxiliar para baixar ferramenta de impressao PDF CLI
Execute: python scripts/install_sumatra.py
"""
import urllib.request
import zipfile
from pathlib import Path

def download_printer_tool():
	script_dir = Path(__file__).parent
	
	# Opção 1: PDFtoPrinter (mais simples e leve - 180KB)
	pdftoprinter = script_dir / "PDFtoPrinter.exe"
	if pdftoprinter.exists():
		print(f"✓ PDFtoPrinter já instalado em: {pdftoprinter}")
		return
	
	# Opção 2: SumatraPDF
	sumatra = script_dir / "SumatraPDF.exe"
	if sumatra.exists():
		print(f"✓ SumatraPDF já instalado em: {sumatra}")
		return
	
	# Tentar baixar PDFtoPrinter primeiro (mais confiável)
	print("Tentando baixar PDFtoPrinter (180KB)...")
	try:
		url = "https://github.com/BtbN/PDFtoPrinter/releases/download/0.17/PDFtoPrinter.exe"
		
		req = urllib.request.Request(
			url,
			headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
		)
		
		with urllib.request.urlopen(req, timeout=60) as response:
			total_size = int(response.headers.get('content-length', 0))
			downloaded = 0
			
			with open(pdftoprinter, 'wb') as f:
				while True:
					chunk = response.read(8192)
					if not chunk:
						break
					f.write(chunk)
					downloaded += len(chunk)
					if total_size > 0:
						percent = (downloaded / total_size) * 100
						print(f"\rProgresso: {percent:.1f}%", end='', flush=True)
		
		print(f"\n✓ PDFtoPrinter instalado em: {pdftoprinter}")
		print("\nPronto! Execute novamente:")
		print("  python scripts/print_ops.py")
		return
	except Exception as e:
		print(f"\n❌ Erro ao baixar PDFtoPrinter: {e}")
	
	# Fallback para instruções manuais
	print("\n" + "=" * 68)
	print("DOWNLOAD MANUAL:")
	print("=" * 68)
	print("\nOPÇÃO 1 - PDFtoPrinter (RECOMENDADO - 180KB):")
	print("  1. Acesse: https://github.com/BtbN/PDFtoPrinter/releases")
	print("  2. Baixe PDFtoPrinter.exe")
	print(f"  3. Copie para: {script_dir}")
	print("\nOPÇÃO 2 - SumatraPDF:")
	print("  1. Acesse: https://www.sumatrapdfreader.org/download-free-pdf-viewer")
	print("  2. Baixe a versão portable ou instalador")
	print(f"  3. Copie SumatraPDF.exe para: {script_dir}")
	print("=" * 68)

if __name__ == "__main__":
	download_printer_tool()
