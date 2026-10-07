'use client';
import { NextPage } from 'next';
import { MediaManager } from '@/components/library/pages/media';

const MediaTrashPage: NextPage = () => <MediaManager mode='trash' />;

export default MediaTrashPage;
