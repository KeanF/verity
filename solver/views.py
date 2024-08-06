from django.shortcuts import render

def solverView(request):
    return render(request, "solver.html")