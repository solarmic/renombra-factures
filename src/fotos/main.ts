import { mount } from 'svelte';
import '@fontsource/chakra-petch/latin-500.css';
import '@fontsource/chakra-petch/latin-600.css';
import '@fontsource/chakra-petch/latin-700.css';
import '@fontsource/chakra-petch/latin-700-italic.css';
import '../ui/app.css';
import './palette.css';
import PhotosApp from './PhotosApp.svelte';

mount(PhotosApp, { target: document.getElementById('app')! });
