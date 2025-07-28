import react, {useContext, useState} from "react";
import { getAuthenticatedRequest } from "../../utils/authService";

const FileParser = () => {

    
    const [selectedFile, setSelectedFile] = useState(null);
    
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);


    const [addCorrectAnsw, setCorrectAnsw] = useState(false);

    const handleChange = (event) => {
        setCorrectAnsw(event.target.checked);
    };

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };



    const handleClick = async () => {

        try {
            if (!selectedFile) {
                alert("No file selected");
                return;
            }

            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("correct_answers", addCorrectAnsw);

            const testsData = await getAuthenticatedRequest(`/upload_pdf/`, "POST", formData);
            setResult(testsData.extracted_text); // assuming testsData is the result you want to show
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
          }

        //send request to backend

    };

    return (
        <div style={{
            maxWidth: "600px",
            margin: "40px auto",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#f9f9f9",
            fontFamily: "Arial, sans-serif"
          }}>

            <h2>AI Question Generator</h2>
            {loading && <p>Loading...</p>}

            {!result && !loading && (
                <>
                    <label>
                        <input
                            type="checkbox"
                            checked={addCorrectAnsw}
                            onChange={handleChange}
                        />
                        Add Correct Answers
                    </label>

                    <input 
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        placeholder="Paste your file here..."
                        style={{
                            display: "block",
                            marginBottom: "20px",
                            padding: "8px",
                            width: "100%",
                            border: "1px solid #ccc",
                            borderRadius: "6px"
                          }}
                    />
                    <button 
                    onClick={handleClick}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "16px",
                        width: "100%"
                      }}
                      >Upload</button>
                </>
            )}

            {result && (
                <div style={{ marginTop: "20px" }}>
                    <p>{result}</p>
                </div>
            )}

        </div>
    )
}


export default FileParser;
