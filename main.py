from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import os

app = FastAPI(title="Smart Campus Information System")

# Serve static files
os.makedirs("static", exist_ok=True)
os.makedirs("templates", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# In-memory student store
students: dict = {}

# ─── Pydantic Models ──────────────────────────────────────────
class StudentIn(BaseModel):
    sid: str
    name: str
    marks: int

class CourseIn(BaseModel):
    sid: str
    course: str

class FeeIn(BaseModel):
    sid: str
    hostel_fee: int
    mess_fee: int

# ─── Helper ────────────────────────────────────────────────────
def compute_grade(marks: int) -> str:
    if marks >= 90:
        return "A"
    elif marks >= 75:
        return "B"
    elif marks >= 50:
        return "C"
    else:
        return "Fail"

# ─── Routes ────────────────────────────────────────────────────

@app.get("/")
def home():
    return FileResponse("templates/index.html")

@app.post("/register")
def register_student(student: StudentIn):
    if student.sid in students:
        raise HTTPException(status_code=400, detail="Student ID already exists.")
    if not (0 <= student.marks <= 100):
        raise HTTPException(status_code=422, detail="Marks must be between 0 and 100.")
    students[student.sid] = {
        "Name": student.name,
        "Marks": student.marks,
        "Grade": compute_grade(student.marks),
        "Course": "Not Assigned",
        "Hostel Fee": 0,
        "Mess Fee": 0,
    }
    return {"message": f"Student '{student.name}' registered successfully!"}

@app.post("/course")
def enroll_course(data: CourseIn):
    if data.sid not in students:
        raise HTTPException(status_code=404, detail="Student not found.")
    students[data.sid]["Course"] = data.course
    return {"message": f"Course '{data.course}' assigned to {students[data.sid]['Name']}."}

@app.post("/hostel_fee")
def save_fee(data: FeeIn):
    if data.sid not in students:
        raise HTTPException(status_code=404, detail="Student not found.")
    students[data.sid]["Hostel Fee"] = data.hostel_fee
    students[data.sid]["Mess Fee"] = data.mess_fee
    return {"message": "Fee details saved successfully."}

@app.get("/records")
def get_records():
    return students

@app.get("/search/{sid}")
def search_student(sid: str):
    if sid not in students:
        raise HTTPException(status_code=404, detail="Student not found.")
    return students[sid]

@app.get("/sort")
def sort_students():
    """Returns students sorted by marks descending (bubble sort)."""
    lst = [{"ID": sid, **data} for sid, data in students.items()]
    n = len(lst)
    for i in range(n):
        for j in range(n - i - 1):
            if lst[j]["Marks"] < lst[j + 1]["Marks"]:
                lst[j], lst[j + 1] = lst[j + 1], lst[j]
    return lst

@app.get("/save")
def save_records():
    with open("student_records.txt", "w") as f:
        for sid, data in students.items():
            f.write(f"{sid} : {data}\n")
    return {"message": "Records saved to student_records.txt"}

@app.get("/analysis")
def analysis():
    if not students:
        raise HTTPException(status_code=404, detail="No student data available.")

    marks = [d["Marks"] for d in students.values()]
    names = [d["Name"] for d in students.values()]

    arr = np.array(marks)
    average = round(float(np.mean(arr)), 2)
    highest = int(np.max(arr))
    lowest = int(np.min(arr))

    # Bar chart
    fig, ax = plt.subplots(figsize=(max(6, len(names)), 4))
    colors = []
    for m in marks:
        if m >= 90:
            colors.append("#22c55e")
        elif m >= 75:
            colors.append("#3b82f6")
        elif m >= 50:
            colors.append("#f59e0b")
        else:
            colors.append("#ef4444")
    ax.bar(names, marks, color=colors, edgecolor="none", width=0.6)
    ax.set_title("Student Performance", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("Students")
    ax.set_ylabel("Marks")
    ax.set_ylim(0, 105)
    ax.grid(axis="y", linestyle="--", alpha=0.5)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    fig.savefig("static/performance.png", dpi=120)
    plt.close(fig)

    # Pie chart
    grade_count = {"A": 0, "B": 0, "C": 0, "Fail": 0}
    for d in students.values():
        grade_count[d["Grade"]] += 1
    labels = [k for k, v in grade_count.items() if v > 0]
    values = [v for v in grade_count.values() if v > 0]
    pie_colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"][:len(labels)]
    fig2, ax2 = plt.subplots(figsize=(5, 5))
    ax2.pie(values, labels=labels, autopct="%1.1f%%", colors=pie_colors,
            startangle=140, wedgeprops=dict(width=0.6))
    ax2.set_title("Grade Distribution", fontsize=14, fontweight="bold")
    fig2.tight_layout()
    fig2.savefig("static/piechart.png", dpi=120)
    plt.close(fig2)

    return {
        "Average": average,
        "Highest": highest,
        "Lowest": lowest,
        "Graph": "/static/performance.png",
        "Pie": "/static/piechart.png",
    }
