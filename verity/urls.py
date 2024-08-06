from django.urls import path
from solver.views import solverView

urlpatterns = [
    path("", solverView)
]
