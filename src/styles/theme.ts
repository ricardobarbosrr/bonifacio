export const darkThemeClasses = {
  container: 'bg-gray-900',
  post: {
    wrapper: 'bg-gray-800 border-gray-700',
    text: 'text-white',
    username: 'text-white',
    caption: 'text-gray-100',
    button: {
      default: 'text-white hover:opacity-80',
      disabled: 'text-gray-500',
    },
    icon: 'text-white',
    input: 'bg-gray-700 text-white placeholder-gray-400 border-gray-600',
    commentSection: 'border-gray-700',
  },
  likes: 'text-white',
  comments: {
    text: 'text-gray-100',
    deleteButton: 'text-gray-400 hover:text-gray-300',
  },
};

export const lightThemeClasses = {
  container: 'bg-gray-50',
  post: {
    wrapper: 'bg-white border-gray-200',
    text: 'text-gray-900',
    username: 'text-gray-900',
    caption: 'text-gray-800',
    button: {
      default: 'text-gray-900 hover:opacity-80',
      disabled: 'text-gray-400',
    },
    icon: 'text-black',
    input: 'bg-white text-gray-900 placeholder-gray-500 border-gray-200',
    commentSection: 'border-gray-200',
  },
  likes: 'text-gray-900',
  comments: {
    text: 'text-gray-800',
    deleteButton: 'text-gray-500 hover:text-gray-700',
  },
};
