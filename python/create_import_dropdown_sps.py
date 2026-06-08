from app.database import engine
from sqlalchemy import text

try:
    with engine.connect() as con:
        # SP_GetOverseasSuppliers
        con.execute(text("DROP PROCEDURE IF EXISTS SP_GetOverseasSuppliers"))
        sp1 = text("""
        CREATE PROCEDURE SP_GetOverseasSuppliers()
        BEGIN
            SELECT s.id, s.name, c.id as currency_id, c.code as currency, pt.name as paymentTerms 
            FROM masters.suppliers s
            LEFT JOIN masters.currencies c ON s.currency = c.id
            LEFT JOIN masters.payment_terms pt ON s.paymentTerms = pt.id
            WHERE s.type = 2 AND s.active = 1;
        END
        """)
        con.execute(sp1)

        # SP_GetPaymentTerms
        con.execute(text("DROP PROCEDURE IF EXISTS SP_GetPaymentTerms"))
        sp2 = text("""
        CREATE PROCEDURE SP_GetPaymentTerms()
        BEGIN
            SELECT * FROM masters.payment_terms;
        END
        """)
        con.execute(sp2)

        # SP_GetActiveItems
        con.execute(text("DROP PROCEDURE IF EXISTS SP_GetActiveItems"))
        sp3 = text("""
        CREATE PROCEDURE SP_GetActiveItems()
        BEGIN
            SELECT id, name FROM masters.items WHERE active = 1;
        END
        """)
        con.execute(sp3)

        # SP_GetCurrencies
        con.execute(text("DROP PROCEDURE IF EXISTS SP_GetCurrencies"))
        sp4 = text("""
        CREATE PROCEDURE SP_GetCurrencies()
        BEGIN
            SELECT id, code, name FROM masters.currencies;
        END
        """)
        con.execute(sp4)

        con.commit()
    print("Dropdown Stored Procedures created successfully.")

except Exception as e:
    print("Error:", e)
