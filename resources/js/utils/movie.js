import axios from 'axios';

export async function syncMovieFromTmdb(tmdbId) {
    const { data: localData } = await axios.get(`/movies/tmdb/${tmdbId}/local-id`);

    if (localData.movie_id) {
        return localData.movie_id;
    }

    const { data: syncData } = await axios.post(`/movies/tmdb/${tmdbId}/sync`);

    return syncData.movie_id;
}
