import "./Pipeline.css";

import {
  FileText,
  ScanSearch,
  BrainCircuit,
  ShieldCheck,
  TriangleAlert,
  BarChart3
} from "lucide-react";

const pipeline = [

  {
    icon: <FileText size={26}/>,
    title: "Document Upload",
    description: "PDF, DOCX, PPTX, Images",
    status: "Completed"
  },

  {
    icon: <ScanSearch size={26}/>,
    title: "OCR & Extraction",
    description: "Text, Tables & Metadata",
    status: "Completed"
  },

  {
    icon: <BrainCircuit size={26}/>,
    title: "AI Analysis",
    description: "LLM & NLP Engine",
    status: "Completed"
  },

  {
    icon: <ShieldCheck size={26}/>,
    title: "Obligation Detection",
    description: "Compliance Mapping",
    status: "Completed"
  },

  {
    icon: <TriangleAlert size={26}/>,
    title: "Risk Assessment",
    description: "Priority & Impact Score",
    status: "Completed"
  },

  {
    icon: <BarChart3 size={26}/>,
    title: "Executive Dashboard",
    description: "Reports & Analytics",
    status: "Live"
  }

];

export default function Pipeline(){

  return(

    <div className="pipeline-card">

      <div className="pipeline-title">

        <h2>

          AI Processing Pipeline

        </h2>

        <p>

          End-to-end intelligent regulatory document analysis workflow

        </p>

      </div>

      <div className="pipeline-container">

        {

          pipeline.map((step,index)=>(

            <div
              className="pipeline-step"
              key={index}
            >

              <div className="pipeline-icon">

                {step.icon}

              </div>

              <h3>

                {step.title}

              </h3>

              <p>

                {step.description}

              </p>

              <span
                className={`pipeline-status ${step.status.toLowerCase()}`}
              >

                {step.status}

              </span>

              {

                index !== pipeline.length-1 &&

                <div className="pipeline-line"></div>

              }

            </div>

          ))

        }

      </div>

    </div>

  );

}