from django.urls import path, include

urlpatterns = [
    path('api/', include('erd_api.urls')),
]
