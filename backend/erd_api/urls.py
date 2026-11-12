from django.urls import path
from .views import HealthCheckView, ParseDraftView, ImportSqlView, ExportSqlView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health'),
    path('parse-draft/', ParseDraftView.as_view(), name='parse_draft'),
    path('import-sql/', ImportSqlView.as_view(), name='import_sql'),
    path('export-sql/', ExportSqlView.as_view(), name='export_sql'),
]
