import 'dotenv/config';

const configuredDistanceThreshold = Number(process.env.FACE_DISTANCE_THRESHOLD);

// face-api.js face descriptors use Euclidean distance; lower values are better.
export const FACE_DISTANCE_THRESHOLD = Number.isFinite(configuredDistanceThreshold)
  ? configuredDistanceThreshold
  : 0.45;
export const FACE_DUPLICATE_THRESHOLD = Number(process.env.FACE_DUPLICATE_THRESHOLD) || 0.45;

export const calculateFaceDistance = (firstDescriptor, secondDescriptor) => {
  if (!Array.isArray(firstDescriptor) || !Array.isArray(secondDescriptor)
    || firstDescriptor.length !== secondDescriptor.length) return Infinity;
  return Math.sqrt(
    firstDescriptor.reduce(
      (sum, value, index) => sum + Math.pow(value - secondDescriptor[index], 2),
      0
    )
  );
};

export const getUserFaceDescriptors = (user) => [
  ...(Array.isArray(user.faceDescriptors) ? user.faceDescriptors : []),
  user.faceDescriptor,
  user.faceEmbedding,
].filter((descriptor) => (
  Array.isArray(descriptor)
  && descriptor.length === 128
  && descriptor.every((value) => typeof value === 'number' && Number.isFinite(value))
));

export const findClosestFace = (faceDescriptor, users) => {
  return users
    .map((user) => {
      const descriptor = getUserFaceDescriptors(user)
        .filter((candidate) => candidate.length === faceDescriptor.length)
        .reduce((closest, candidate) => (
          !closest || calculateFaceDistance(faceDescriptor, candidate) < calculateFaceDistance(faceDescriptor, closest)
            ? candidate
            : closest
        ), null);
      return {
        user,
        descriptor,
        distance: descriptor ? calculateFaceDistance(faceDescriptor, descriptor) : Infinity,
      };
    })
    .filter((match) => Number.isFinite(match.distance))
    .sort((first, second) => first.distance - second.distance)[0];
};

export const calculateFaceConfidence = (distance) => Math.max(
  0,
  Math.min(1, 1 - distance),
);

export const isReliableFaceMatch = (distance) => Number.isFinite(distance)
  && distance <= FACE_DISTANCE_THRESHOLD;

export const findConsensusFace = (descriptors, users) => {
  const matches = descriptors.map((descriptor) => findClosestFace(descriptor, users)).filter(Boolean);
  if (!matches.length) return null;
  const candidates = new Map();
  matches.forEach((match) => {
    const key = String(match.user._id);
    const current = candidates.get(key) || { user: match.user, distances: [], reliableCount: 0 };
    current.distances.push(match.distance);
    if (isReliableFaceMatch(match.distance)) current.reliableCount += 1;
    candidates.set(key, current);
  });
  return [...candidates.values()]
    .map((candidate) => ({
      user: candidate.user,
      distance: candidate.distances.reduce((sum, value) => sum + value, 0) / candidate.distances.length,
      reliableCount: candidate.reliableCount,
      frameCount: descriptors.length,
    }))
    .sort((first, second) => second.reliableCount - first.reliableCount || first.distance - second.distance)[0];
};
