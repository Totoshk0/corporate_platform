import os
from docx import Document
from openpyxl import Workbook
from pypdf import PdfWriter, PdfReader
import io

def create_samples():
    os.makedirs('sample_docs', exist_ok=True)

    # 1. Текстовый файл
    with open('sample_docs/rules.txt', 'w', encoding='utf-8') as f:
        f.write("Корпоративные правила: Рабочий день начинается в 9:00. Дресс-код свободный.")

    # 2. Word файл
    doc = Document()
    doc.add_heading('Инструкция по безопасности', 0)
    doc.add_paragraph('Никогда не передавайте свой пароль третьим лицам. Используйте двухфакторную аутентификацию.')
    doc.save('sample_docs/security.docx')

    # 3. Excel файл
    wb = Workbook()
    ws = wb.active
    ws['A1'] = 'Отдел'
    ws['B1'] = 'Бюджет 2026'
    ws['A2'] = 'Разработка'
    ws['B2'] = '50,000,000 руб'
    ws['A3'] = 'Маркетинг'
    ws['B3'] = '20,000,000 руб'
    wb.save('sample_docs/budget.xlsx')

    # 4. PDF файл
    print("Файлы созданы в папке sample_docs/")

if __name__ == "__main__":
    create_samples()
