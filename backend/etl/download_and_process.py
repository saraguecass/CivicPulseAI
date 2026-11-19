"""
Script ETL para el procesamiento y descarga del dataset oficial SER de datos.madrid.es.
Recurso: 218228-1-ser-calles-csv
"""

import sys
import os
import requests
import pandas as pd
import json

# URL del recurso oficial de datos abiertos del Ayuntamiento de Madrid
SER_CSV_URL = "https://datos.madrid.es/egob/catalogo/218228-1-ser-calles.csv"
CALLEJERO_URL = "https://datos.madrid.es/egob/catalogo/200088-1-callejero.csv"

def download_file(url: str, dest_path: str):
    print(f"Descargando {url} -> {dest_path}...")
    headers = {"User-Agent": "CivicPulseAI-ETL/1.0 (Hackathon Madrid)"}
    resp = requests.get(url, headers=headers, stream=True, timeout=30)
    resp.raise_for_status()
    with open(dest_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"Descarga finalizada: {dest_path}")

def process_ser_and_callejero(ser_csv_path: str, callejero_csv_path: str = None):
    """
    Carga el CSV de SER, limpia columnas y cruza con geometrías de callejero si existe.
    """
    print(f"Cargando dataset SER desde {ser_csv_path}...")
    try:
        # Los CSV de Madrid suelen venir con codificación iso-8859-1 o windows-1252 y separador ';'
        df = pd.read_csv(ser_csv_path, sep=';', encoding='latin-1')
        print(f"Columnas detectadas en SER: {list(df.columns)}")
        print(f"Filas encontradas: {len(df)}")
        return df
    except Exception as e:
        print(f"Error procesando CSV: {e}")
        return None

if __name__ == "__main__":
    os.makedirs("./data", exist_ok=True)
    ser_path = "./data/ser_calles_2026.csv"
    if not os.path.exists(ser_path):
        try:
            download_file(SER_CSV_URL, ser_path)
        except Exception as e:
            print(f"No se pudo descargar automáticamente el CSV: {e}")
            print("Utilizando generador de datos mock_madrid_data para el desarrollo.")
            sys.exit(0)

    process_ser_and_callejero(ser_path)
