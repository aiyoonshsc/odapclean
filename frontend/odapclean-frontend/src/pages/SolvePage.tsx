import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactCrop from 'react-image-crop';
import type { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getProblem, solveProblem } from '../services/api';
import type { ProblemWithHints } from '../types';

const SolvePage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const [problem, setProblem] = useState<ProblemWithHints | null>(null);
  const [solution, setSolution] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    const fetchProblem = async () => {
      if (problemId) {
        try {
          const fetchedProblem = await getProblem(parseInt(problemId, 10));
          setProblem(fetchedProblem);
        } catch (error) {
          console.error('Error fetching problem:', error);
        }
      }
    };
    fetchProblem();
  }, [problemId]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!problemId || (!solution && !completedCrop)) return;

    let imageBlob: Blob | null = null;
    if (completedCrop && imgRef.current) {
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(
                image,
                completedCrop.x * scaleX,
                completedCrop.y * scaleY,
                completedCrop.width * scaleX,
                completedCrop.height * scaleY,
                0,
                0,
                completedCrop.width,
                completedCrop.height
            );
            imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
        }
    }

    try {
      await solveProblem(parseInt(problemId, 10), solution, imageBlob);
      // 성공 처리 로직 (예: 다음 문제로 넘어가기)
    } catch (error) {
      console.error('Error solving problem:', error);
    }
  };

  if (!problem) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{problem.title}</h1>
      <p>{problem.content}</p>
      {problem.image_url && <img src={`http://localhost:8001${problem.image_url}`} alt="Problem" />}

      <div>
        <input type="file" accept="image/*" onChange={onSelectFile} />
        {imageSrc && (
          <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
            <img ref={imgRef} src={imageSrc} />
          </ReactCrop>
        )}
      </div>

      <textarea value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="답안을 입력하세요" />
      <button onClick={handleSubmit}>제출</button>
    </div>
  );
};

export default SolvePage;
