@echo off
REM Script para iniciar o Maestro com o ambiente virtual

REM Mudar para o diretório do projeto
cd /d "%~dp0"

REM Executar o aplicativo usando o Python do ambiente virtual
.\.venv\Scripts\python.exe .\scripts\main.py

REM Pausar no final se houver erro
if errorlevel 1 pause
